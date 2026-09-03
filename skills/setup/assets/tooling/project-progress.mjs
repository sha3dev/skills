#!/usr/bin/env node

import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const statuses = ["pending", "in-progress", "complete"];

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function option(args, name) {
	const index = args.indexOf(name);
	return index === -1 ? undefined : args[index + 1];
}

function parseBlocks(source) {
	const heading = "## Repository blocks\n";
	const start = source.indexOf(heading);
	if (start === -1) fail("PROJECT.md has no Repository blocks section");
	const contentStart = start + heading.length;
	const end = source.indexOf("\n## ", contentStart);
	const section = source.slice(contentStart, end === -1 ? source.length : end);
	const pattern =
		/^### (.+)\n\n- Type: `(web|api|worker)`\n- Path: `([^`]+)`\n- Responsibility: ([^\n]+)\n- Progress:\n((?: {2}- `[^`]+`: `(?:pending|in-progress|complete)`\n)+)/gm;
	const blocks = [];
	let cursor = 0;

	for (const match of section.matchAll(pattern)) {
		if (section.slice(cursor, match.index).trim()) {
			fail("PROJECT.md contains an invalid repository block");
		}
		const progress = {};
		for (const phase of match[5].matchAll(
			/^ {2}- `([^`]+)`: `(pending|in-progress|complete)`$/gm,
		)) {
			if (progress[phase[1]])
				fail(`Duplicate phase in ${match[1]}: ${phase[1]}`);
			progress[phase[1]] = phase[2];
		}
		if (!progress.surface) fail(`${match[1]} has no surface phase`);
		blocks.push({
			name: match[1],
			type: match[2],
			path: match[3],
			responsibility: match[4],
			progress,
			start: contentStart + match.index,
			end: contentStart + match.index + match[0].length,
		});
		cursor = match.index + match[0].length;
	}

	if (blocks.length === 0) fail("PROJECT.md has no valid repository blocks");
	if (section.slice(cursor).trim()) {
		fail("PROJECT.md contains an invalid repository block");
	}
	const names = new Set();
	for (const block of blocks) {
		const name = block.name.toLocaleLowerCase("en");
		if (names.has(name)) fail(`Duplicate repository block: ${block.name}`);
		names.add(name);
	}
	return blocks;
}

function publicBlock(block) {
	const { start: _start, end: _end, ...result } = block;
	return result;
}

try {
	const args = process.argv.slice(2);
	const root = resolve(option(args, "--root") ?? ".");
	const blockName = option(args, "--block");
	const type = option(args, "--type");
	const phase = option(args, "--phase");
	const nextStatus = option(args, "--set");
	const reopen = args.includes("--reopen");
	if (type && !["web", "api", "worker"].includes(type)) {
		fail("--type must be web, api, or worker");
	}
	if (nextStatus && !statuses.includes(nextStatus)) {
		fail("--set must be pending, in-progress, or complete");
	}
	if (nextStatus && (!blockName || !phase)) {
		fail("--set requires --block and --phase");
	}

	const projectPath = join(root, "PROJECT.md");
	const source = await readFile(projectPath, "utf8");
	let blocks = parseBlocks(source);
	if (type) blocks = blocks.filter((block) => block.type === type);
	if (blockName) {
		const normalized = blockName.toLocaleLowerCase("en");
		blocks = blocks.filter(
			(block) => block.name.toLocaleLowerCase("en") === normalized,
		);
	}
	if (blocks.length === 0) fail("No matching repository block");
	if (blockName && blocks.length !== 1) fail("Repository block is not unique");

	if (nextStatus) {
		const block = blocks[0];
		const current = block.progress[phase];
		if (!current) fail(`${block.name} has no ${phase} phase`);
		const normalTransition =
			(current === "pending" && nextStatus === "in-progress") ||
			(current === "in-progress" && nextStatus === "complete") ||
			current === nextStatus;
		const reopenTransition =
			reopen && current === "complete" && nextStatus === "in-progress";
		if (!normalTransition && !reopenTransition) {
			fail(`Invalid ${phase} transition: ${current} -> ${nextStatus}`);
		}
		if (current !== nextStatus) {
			const before = `  - \`${phase}\`: \`${current}\``;
			const after = `  - \`${phase}\`: \`${nextStatus}\``;
			const blockSource = source.slice(block.start, block.end);
			if (!blockSource.includes(before)) fail(`Cannot locate ${phase} status`);
			const updated = `${source.slice(0, block.start)}${blockSource.replace(
				before,
				after,
			)}${source.slice(block.end)}`;
			const temporaryPath = join(
				dirname(projectPath),
				`.PROJECT.md.${process.pid}.tmp`,
			);
			await writeFile(temporaryPath, updated, { flag: "wx" });
			await rename(temporaryPath, projectPath);
			block.progress[phase] = nextStatus;
		}
	}

	process.stdout.write(
		`${JSON.stringify({ blocks: blocks.map(publicBlock) }, null, 2)}\n`,
	);
} catch (error) {
	fail(error.message);
}
