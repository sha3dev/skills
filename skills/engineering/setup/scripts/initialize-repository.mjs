#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { constants } from "node:fs";
import {
	access,
	mkdir,
	readFile,
	rmdir,
	stat,
	unlink,
	writeFile,
} from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertMinimumVersion } from "../assets/tooling/version-policy.mjs";
import { getRepositoryState } from "./repo-state.mjs";

const assetDirectory = fileURLToPath(new URL("../assets/", import.meta.url));
const scriptDirectory = fileURLToPath(new URL("./", import.meta.url));

function fail(message) {
	throw new Error(message);
}

function option(args, name) {
	const index = args.indexOf(name);
	if (index === -1 || !args[index + 1]) fail(`Missing ${name}`);
	return args[index + 1];
}

function text(value, path) {
	if (typeof value !== "string" || !value.trim()) {
		fail(`${path} must be a non-empty string`);
	}
	const normalized = value.trim();
	if (/\r|\n/.test(normalized)) fail(`${path} must be a single line`);
	if (normalized.includes("{{") || normalized.includes("}}")) {
		fail(`${path} contains a template delimiter`);
	}
	return normalized;
}

function stringList(value, path, minimum = 1, maximum = Infinity) {
	if (
		!Array.isArray(value) ||
		value.length < minimum ||
		value.length > maximum
	) {
		const range =
			maximum === Infinity ? `${minimum} or more` : `${minimum}-${maximum}`;
		fail(`${path} must contain ${range} items`);
	}
	return value.map((item, index) => text(item, `${path}[${index}]`));
}

function object(value, path) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		fail(`${path} must be an object`);
	}
	return value;
}

function exactKeys(value, allowed, path) {
	const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
	if (unknown.length) fail(`${path} has unknown fields: ${unknown.join(", ")}`);
}

function normalizeInput(raw) {
	const input = object(raw, "input");
	exactKeys(input, ["title", "definition", "blocks", "relationships"], "input");

	const title = text(input.title, "title");
	const definition = stringList(input.definition, "definition", 4, 5);
	if (!Array.isArray(input.blocks) || input.blocks.length === 0) {
		fail("blocks must contain at least one block");
	}

	const names = new Set();
	const folders = new Set();
	const blocks = input.blocks.map((rawBlock, index) => {
		const path = `blocks[${index}]`;
		const block = object(rawBlock, path);
		const ownership = text(block.ownership, `${path}.ownership`);
		const commonKeys = ["name", "responsibility", "ownership"];

		if (ownership !== "repository" && ownership !== "external") {
			fail(`${path}.ownership must be repository or external`);
		}

		exactKeys(
			block,
			ownership === "repository"
				? [...commonKeys, "type", "folder", "contents", "readWhen"]
				: commonKeys,
			path,
		);

		const name = text(block.name, `${path}.name`);
		const normalizedName = name.toLocaleLowerCase("en");
		if (names.has(normalizedName)) fail(`Duplicate block name: ${name}`);
		names.add(normalizedName);

		const normalized = {
			name,
			responsibility: text(block.responsibility, `${path}.responsibility`),
			ownership,
		};

		if (ownership === "external") return normalized;

		const type = text(block.type, `${path}.type`);
		if (!new Set(["web", "api", "worker"]).has(type)) {
			fail(`${path}.type must be web, api, or worker`);
		}

		const folder = text(block.folder, `${path}.folder`);
		if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(folder)) {
			fail(`${path}.folder must be kebab-case`);
		}
		if (folders.has(folder)) fail(`Duplicate block folder: ${folder}`);
		folders.add(folder);

		return {
			...normalized,
			type,
			folder,
			contents: stringList(block.contents, `${path}.contents`),
			readWhen: stringList(block.readWhen, `${path}.readWhen`),
		};
	});

	if (!blocks.some((block) => block.ownership === "repository")) {
		fail("blocks must contain at least one repository block");
	}

	if (!Array.isArray(input.relationships)) {
		fail("relationships must be an array");
	}
	const blockNames = new Set(blocks.map((block) => block.name));
	const pairs = new Set();
	const relationships = input.relationships.map((rawRelationship, index) => {
		const path = `relationships[${index}]`;
		const relationship = object(rawRelationship, path);
		exactKeys(relationship, ["from", "to", "description"], path);
		const from = text(relationship.from, `${path}.from`);
		const to = text(relationship.to, `${path}.to`);
		if (!blockNames.has(from)) fail(`${path}.from references an unknown block`);
		if (!blockNames.has(to)) fail(`${path}.to references an unknown block`);
		if (from === to) fail(`${path} must connect two different blocks`);
		const pair = `${from}\0${to}`;
		if (pairs.has(pair)) fail(`Duplicate relationship: ${from} -> ${to}`);
		pairs.add(pair);
		return {
			from,
			to,
			description: text(relationship.description, `${path}.description`),
		};
	});

	return { title, definition, blocks, relationships };
}

function render(template, replacements, path) {
	let output = template;
	for (const [placeholder, value] of Object.entries(replacements)) {
		output = output.replaceAll(`{{${placeholder}}}`, value);
	}
	const remaining = output.match(/\{\{[A-Z0-9_]+\}\}/g);
	if (remaining) {
		fail(
			`${path} has unresolved placeholders: ${[...new Set(remaining)].join(", ")}`,
		);
	}
	return output.endsWith("\n") ? output : `${output}\n`;
}

async function loadAsset(name) {
	return readFile(resolve(assetDirectory, name), "utf8");
}

function formattedJson(value) {
	return `${JSON.stringify(value, null, "\t")}\n`;
}

async function buildFiles(input) {
	const assets = await Promise.all([
		loadAsset("AGENTS.md"),
		loadAsset("CLAUDE.md"),
		loadAsset("PROJECT.md"),
		loadAsset("SOLUTION-MAP.md"),
		loadAsset("FOLDER.md"),
		readFile(resolve(scriptDirectory, "repo-state.mjs"), "utf8"),
		loadAsset("tooling/biome.json"),
		loadAsset("tooling/tsconfig.json"),
		loadAsset("tooling/toolchain-policy.json"),
		loadAsset("tooling/verify-toolchain.mjs"),
		loadAsset("tooling/version-policy.mjs"),
	]);
	const [
		agents,
		claude,
		projectTemplate,
		mapTemplate,
		folderTemplate,
		repoState,
		biome,
		tsconfig,
		policySource,
		toolchainVerifier,
		versionPolicy,
	] = assets;
	const policy = JSON.parse(policySource);
	const nodeVersion = process.versions.node;
	const npmVersion = execFileSync("npm", ["--version"], {
		encoding: "utf8",
	}).trim();
	assertMinimumVersion(
		nodeVersion,
		policy.minimumRuntimeVersions.node,
		"Node.js",
	);
	assertMinimumVersion(npmVersion, policy.minimumRuntimeVersions.npm, "npm");

	const repositoryBlocks = input.blocks.filter(
		(block) => block.ownership === "repository",
	);
	const externalBlocks = input.blocks.filter(
		(block) => block.ownership === "external",
	);
	const blockByName = new Map(input.blocks.map((block) => [block.name, block]));
	const blockReference = (name) => {
		const block = blockByName.get(name);
		return block.ownership === "repository"
			? `[${block.name}](./src/${block.folder}/FOLDER.md)`
			: `**${block.name}**`;
	};
	const repositoryLines = repositoryBlocks.map(
		(block) => `- ${blockReference(block.name)}`,
	);
	const externalSection = externalBlocks.length
		? `\n\n## External blocks\n\n${externalBlocks
				.map((block) => `- **${block.name}** — ${block.responsibility}`)
				.join("\n")}`
		: "";
	const relationshipSection = input.relationships.length
		? `\n\n## Relationships\n\n${input.relationships
				.map(
					(relationship) =>
						`- ${blockReference(relationship.from)} → ${blockReference(relationship.to)} — ${relationship.description}`,
				)
				.join("\n")}`
		: "";

	const packageJson = formattedJson({
		private: true,
		type: "module",
		scripts: {
			...policy.requiredScripts,
			check: "npm run check:tooling",
		},
		dependencies: policy.minimumDependencyVersions,
		devDependencies: {
			...policy.minimumPlatformDevDependencyVersions,
			...policy.minimumToolVersions,
		},
		engines: {
			node: `>=${policy.minimumRuntimeVersions.node}`,
		},
		packageManager: `npm@${npmVersion}`,
	});
	const ignoredDependencies = [
		...Object.keys(policy.minimumDependencyVersions),
		...Object.keys(policy.minimumPlatformDevDependencyVersions),
	]
		.map((name) => `\t\t${JSON.stringify(name)}`)
		.join(",\n");
	const knip = `{
\t"$schema": "https://unpkg.com/knip@${policy.minimumToolVersions.knip}/schema.json",
\t"ignore": [".agents/**", "src/*/assets/**/*.js"],
\t"ignoreDependencies": [
${ignoredDependencies}
\t]
}\n`;

	const files = [
		{ path: "AGENTS.md", content: agents, copiedFrom: "assets/AGENTS.md" },
		{ path: "CLAUDE.md", content: claude, copiedFrom: "assets/CLAUDE.md" },
		{
			path: "PROJECT.md",
			content: render(
				projectTemplate,
				{
					PROJECT_TITLE: input.title,
					PROJECT_DEFINITION: input.definition.join(" "),
				},
				"PROJECT.md",
			),
		},
		{
			path: "SOLUTION-MAP.md",
			content: render(
				mapTemplate,
				{
					REPOSITORY_BLOCKS: repositoryLines.join("\n"),
					EXTERNAL_BLOCKS: externalSection,
					RELATIONSHIPS: relationshipSection,
				},
				"SOLUTION-MAP.md",
			),
		},
		{
			path: ".agents/tools/repo-state.mjs",
			content: repoState,
			copiedFrom: "scripts/repo-state.mjs",
			mode: 0o755,
		},
		{
			path: ".agents/tools/verify-toolchain.mjs",
			content: toolchainVerifier,
			copiedFrom: "assets/tooling/verify-toolchain.mjs",
			mode: 0o755,
		},
		{
			path: ".agents/tools/version-policy.mjs",
			content: versionPolicy,
			copiedFrom: "assets/tooling/version-policy.mjs",
		},
		{
			path: ".agents/toolchain-policy.json",
			content: policySource,
			copiedFrom: "assets/tooling/toolchain-policy.json",
		},
		{
			path: "biome.json",
			content: biome,
			copiedFrom: "assets/tooling/biome.json",
		},
		{
			path: "tsconfig.json",
			content: tsconfig,
			copiedFrom: "assets/tooling/tsconfig.json",
		},
		{ path: "knip.json", content: knip },
		{ path: "package.json", content: packageJson },
		{ path: ".node-version", content: `${nodeVersion}\n` },
	];

	for (const block of input.blocks.filter(
		(candidate) => candidate.ownership === "repository",
	)) {
		files.push({
			path: `src/${block.folder}/FOLDER.md`,
			content: render(
				folderTemplate,
				{
					BLOCK_NAME: block.name,
					BLOCK_TYPE: block.type,
					BLOCK_RESPONSIBILITY: block.responsibility,
					BLOCK_CONTENTS: block.contents.map((item) => `- ${item}`).join("\n"),
					BLOCK_READ_WHEN: block.readWhen.map((item) => `- ${item}`).join("\n"),
				},
				`src/${block.folder}/FOLDER.md`,
			),
		});
	}

	return files;
}

async function exists(path) {
	try {
		await access(path, constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

async function preflight(root, input, files) {
	const state = await getRepositoryState(root);
	if (state.state !== "ready_for_setup") {
		fail(`Repository state is ${JSON.stringify(state)}`);
	}

	for (const block of input.blocks.filter(
		(candidate) => candidate.ownership === "repository",
	)) {
		if (await exists(resolve(root, "src", block.folder))) {
			fail(`Output folder already exists: src/${block.folder}`);
		}
	}

	for (const file of files) {
		if (await exists(resolve(root, file.path))) {
			fail(`Output file already exists: ${file.path}`);
		}
	}
}

function preview(files) {
	const lines = ["# Setup preview", "", "## Files", ""];
	for (const file of files) lines.push(`- \`${file.path}\``);

	lines.push("", "## Contents", "");
	for (const file of files) {
		lines.push(`### \`${file.path}\``, "");
		if (file.path.endsWith(".mjs")) {
			lines.push(`Copied verbatim from \`${file.copiedFrom}\`.`, "");
		} else {
			lines.push("```markdown", file.content.trimEnd(), "```", "");
		}
	}
	return `${lines.join("\n").trimEnd()}\n`;
}

async function ensureDirectory(path, createdDirectories) {
	try {
		const info = await stat(path);
		if (!info.isDirectory()) fail(`Directory path is not a directory: ${path}`);
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
		await mkdir(path);
		createdDirectories.push(path);
	}
}

async function writeFiles(root, input, files) {
	const createdFiles = [];
	const createdDirectories = [];

	try {
		await ensureDirectory(resolve(root, ".agents"), createdDirectories);
		await ensureDirectory(resolve(root, ".agents/tools"), createdDirectories);
		await ensureDirectory(resolve(root, "src"), createdDirectories);

		for (const block of input.blocks.filter(
			(candidate) => candidate.ownership === "repository",
		)) {
			const directory = resolve(root, "src", block.folder);
			await mkdir(directory);
			createdDirectories.push(directory);
		}

		const ordered = [...files].sort((left, right) => {
			if (left.path === "SOLUTION-MAP.md") return 1;
			if (right.path === "SOLUTION-MAP.md") return -1;
			return left.path.localeCompare(right.path);
		});

		for (const file of ordered) {
			const target = resolve(root, file.path);
			await ensureDirectory(dirname(target), createdDirectories);
			await writeFile(target, file.content, {
				encoding: "utf8",
				flag: "wx",
				mode: file.mode ?? 0o644,
			});
			createdFiles.push(target);
		}
	} catch (error) {
		for (const file of createdFiles.reverse())
			await unlink(file).catch(() => {});
		for (const directory of createdDirectories.reverse()) {
			await rmdir(directory).catch(() => {});
		}
		throw error;
	}
}

async function main() {
	const args = process.argv.slice(2);
	const dryRun = args.includes("--dry-run");
	const write = args.includes("--write");
	if (dryRun === write) fail("Choose exactly one of --dry-run or --write");

	const root = resolve(option(args, "--root"));
	const initialState = await getRepositoryState(root);
	if (initialState.state !== "ready_for_setup") {
		fail(`Repository state is ${JSON.stringify(initialState)}`);
	}
	const inputPath = resolve(option(args, "--input"));
	const input = normalizeInput(JSON.parse(await readFile(inputPath, "utf8")));
	const files = await buildFiles(input);
	await preflight(root, input, files);

	if (dryRun) {
		process.stdout.write(preview(files));
		return;
	}

	await writeFiles(root, input, files);
	process.stdout.write(
		`${JSON.stringify({ state: "initialized", files: files.map((file) => file.path) })}\n`,
	);
}

main().catch((error) => {
	process.stderr.write(`${JSON.stringify({ error: error.message })}\n`);
	process.exitCode = 1;
});
