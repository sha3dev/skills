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

function parseApplications(source) {
	const heading = "## Applications\n";
	const start = source.indexOf(heading);
	if (start === -1) fail("PROJECT.md has no Applications section");
	const contentStart = start + heading.length;
	const end = source.indexOf("\n## ", contentStart);
	const section = source.slice(contentStart, end === -1 ? source.length : end);
	const pattern =
		/^### (.+)\n\n- Type: `(web|api|worker)`\n- Path: `([^`]+)`\n- Responsibility: ([^\n]+)\n- Progress:\n((?: {2}- `[^`]+`: `(?:pending|in-progress|complete)`\n)+)/gm;
	const applications = [];
	let cursor = 0;

	for (const match of section.matchAll(pattern)) {
		if (section.slice(cursor, match.index).trim()) {
			fail("PROJECT.md contains an invalid application");
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
		applications.push({
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

	if (applications.length === 0) fail("PROJECT.md has no valid applications");
	if (section.slice(cursor).trim()) {
		fail("PROJECT.md contains an invalid application");
	}
	const names = new Set();
	for (const application of applications) {
		const name = application.name.toLocaleLowerCase("en");
		if (names.has(name)) fail(`Duplicate application: ${application.name}`);
		names.add(name);
	}
	return applications;
}

function publicApplication(application) {
	const { start: _start, end: _end, ...result } = application;
	return result;
}

try {
	const args = process.argv.slice(2);
	const root = resolve(option(args, "--root") ?? ".");
	const applicationName = option(args, "--app");
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
	if (nextStatus && (!applicationName || !phase)) {
		fail("--set requires --app and --phase");
	}

	const projectPath = join(root, "PROJECT.md");
	const source = await readFile(projectPath, "utf8");
	let applications = parseApplications(source);
	if (type) {
		applications = applications.filter(
			(application) => application.type === type,
		);
	}
	if (applicationName) {
		const normalized = applicationName.toLocaleLowerCase("en");
		applications = applications.filter(
			(application) => application.name.toLocaleLowerCase("en") === normalized,
		);
	}
	if (applications.length === 0) fail("No matching application");
	if (applicationName && applications.length !== 1) {
		fail("Application is not unique");
	}

	if (nextStatus) {
		const application = applications[0];
		const current = application.progress[phase];
		if (!current) fail(`${application.name} has no ${phase} phase`);
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
			const applicationSource = source.slice(application.start, application.end);
			if (!applicationSource.includes(before)) {
				fail(`Cannot locate ${phase} status`);
			}
			const updated = `${source.slice(0, application.start)}${applicationSource.replace(
				before,
				after,
			)}${source.slice(application.end)}`;
			const temporaryPath = join(
				dirname(projectPath),
				`.PROJECT.md.${process.pid}.tmp`,
			);
			await writeFile(temporaryPath, updated, { flag: "wx" });
			await rename(temporaryPath, projectPath);
			application.progress[phase] = nextStatus;
		}
	}

	process.stdout.write(
		`${JSON.stringify({ applications: applications.map(publicApplication) }, null, 2)}\n`,
	);
} catch (error) {
	fail(error.message);
}
