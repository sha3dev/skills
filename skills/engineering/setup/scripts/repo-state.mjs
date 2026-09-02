#!/usr/bin/env node

import { constants, realpathSync } from "node:fs";
import { access, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const allowedBeforeSetup = new Set([
	".DS_Store",
	".agents",
	".claude",
	".codex",
	".editorconfig",
	".git",
	".gitattributes",
	".gitignore",
	"LICENSE",
	"LICENSE.md",
	"LICENSE.txt",
	"README.md",
	"skills-lock.json",
]);

async function exists(path) {
	try {
		await access(path, constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

export async function getRepositoryState(rootInput = ".") {
	const root = resolve(rootInput);

	if (!(await exists(resolve(root, ".git")))) {
		return { state: "not_repository" };
	}

	const entries = await readdir(root);
	const markers = ["PROJECT.md"].filter((entry) => entries.includes(entry));

	if (markers.length > 0) {
		return { state: "already_initialized", markers };
	}

	const reservedOutputs = [
		"AGENTS.md",
		"CLAUDE.md",
		".agents/tools/repo-state.mjs",
	];
	const conflicts = [];

	for (const path of reservedOutputs) {
		if (await exists(resolve(root, path))) conflicts.push(path);
	}

	if (conflicts.length > 0) {
		return { state: "output_conflict", paths: conflicts };
	}

	const unexpected = entries
		.filter((entry) => !allowedBeforeSetup.has(entry))
		.sort();

	return unexpected.length
		? { state: "not_empty", entries: unexpected }
		: { state: "ready_for_setup" };
}

function option(args, name, fallback) {
	const index = args.indexOf(name);
	if (index === -1) return fallback;
	if (!args[index + 1]) throw new Error(`Missing value for ${name}`);
	return args[index + 1];
}

async function main() {
	const args = process.argv.slice(2);
	const expected = option(args, "--expect", undefined);
	const result = await getRepositoryState(option(args, "--root", "."));
	process.stdout.write(`${JSON.stringify(result)}\n`);

	if (expected && result.state !== expected) process.exitCode = 2;
}

const invokedPath = process.argv[1]
	? pathToFileURL(realpathSync(resolve(process.argv[1]))).href
	: "";

if (import.meta.url === invokedPath) {
	main().catch((error) => {
		process.stderr.write(`${JSON.stringify({ error: error.message })}\n`);
		process.exitCode = 1;
	});
}
