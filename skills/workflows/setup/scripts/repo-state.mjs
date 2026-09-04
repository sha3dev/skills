#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { constants, realpathSync } from "node:fs";
import { access, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const conflictingBeforeSetup = new Set([
	".node-version",
	".nvmrc",
	"apps",
	"biome.json",
	"bun.lockb",
	"knip.json",
	"npm-shrinkwrap.json",
	"package-lock.json",
	"package.json",
	"packages",
	"pnpm-lock.yaml",
	"pnpm-workspace.yaml",
	"src",
	"tsconfig.json",
	"turbo.json",
	"yarn.lock",
]);

const sourceExtension = /\.(?:c|m)?[jt]sx?$/;

function conflictsBeforeSetup(entry) {
	return conflictingBeforeSetup.has(entry) || sourceExtension.test(entry);
}

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
	const projectMarker = ".flow/project.json";
	const markers = (await exists(resolve(root, projectMarker)))
		? [projectMarker]
		: [];

	if (markers.length > 0) {
		const progressTool = resolve(root, ".flow/tools/project-progress.mjs");
		if (!(await exists(progressTool))) {
			return {
				state: "invalid_project",
				markers,
				error: ".flow/tools/project-progress.mjs is missing",
			};
		}
		const progress = spawnSync(
			process.execPath,
			[progressTool, "--root", root],
			{ encoding: "utf8" },
		);
		if (progress.status !== 0) {
			return {
				state: "invalid_project",
				markers,
				error: progress.stderr.trim() || ".flow/project.json could not be parsed",
			};
		}
		// The progress tool is the single parser and validator of project.json;
		// callers read applications and relationships from this state.
		const { applications, relationships } = JSON.parse(progress.stdout);
		return { state: "already_initialized", markers, applications, relationships };
	}

	const reservedOutputs = [
		"AGENTS.md",
		"CLAUDE.md",
		".flow/tools/repo-state.mjs",
	];
	const conflicts = [];

	for (const path of reservedOutputs) {
		if (await exists(resolve(root, path))) conflicts.push(path);
	}

	if (conflicts.length > 0) {
		return { state: "output_conflict", paths: conflicts };
	}

	const unexpected = entries.filter(conflictsBeforeSetup).sort();

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
