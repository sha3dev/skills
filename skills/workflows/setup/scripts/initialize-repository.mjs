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
const applicationTypes = new Set(["web", "api"]);

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
	return normalized;
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

function applicationFolder(name, path) {
	const folder = name
		.normalize("NFKD")
		.replace(/\p{Diacritic}/gu, "")
		.toLocaleLowerCase("en")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	if (!folder) fail(`${path}.name does not produce a valid application path`);
	return folder;
}

function normalizeInput(raw) {
	const input = object(raw, "input");
	exactKeys(
		input,
		["title", "definition", "terms", "applications", "relationships"],
		"input",
	);

	const title = text(input.title, "title");
	const definition = text(input.definition, "definition");
	if (!Array.isArray(input.terms)) {
		fail("terms must be an array");
	}
	const termNames = new Set();
	const terms = input.terms.map((rawEntry, index) => {
		const path = `terms[${index}]`;
		const entry = object(rawEntry, path);
		exactKeys(entry, ["term", "definition"], path);
		const term = text(entry.term, `${path}.term`);
		const normalizedTerm = term.toLocaleLowerCase("en");
		if (termNames.has(normalizedTerm)) {
			fail(`Duplicate domain term: ${term}`);
		}
		termNames.add(normalizedTerm);
		return {
			term,
			definition: text(entry.definition, `${path}.definition`),
		};
	});
	if (!Array.isArray(input.applications) || input.applications.length === 0) {
		fail("applications must contain at least one application");
	}

	const names = new Set();
	const folders = new Set();
	const applications = input.applications.map((rawApplication, index) => {
		const path = `applications[${index}]`;
		const application = object(rawApplication, path);
		exactKeys(application, ["name", "responsibility", "type"], path);

		const name = text(application.name, `${path}.name`);
		const normalizedName = name.toLocaleLowerCase("en");
		if (names.has(normalizedName)) fail(`Duplicate application name: ${name}`);
		names.add(normalizedName);

		const type = text(application.type, `${path}.type`);
		if (!applicationTypes.has(type)) {
			fail(`${path}.type must be web or api`);
		}

		const folder = applicationFolder(name, path);
		if (folders.has(folder))
			fail(`Duplicate derived application path: apps/${folder}/`);
		folders.add(folder);

		return {
			name,
			responsibility: text(
				application.responsibility,
				`${path}.responsibility`,
			),
			type,
			folder,
		};
	});

	if (!Array.isArray(input.relationships)) {
		fail("relationships must be an array");
	}
	const applicationNames = new Set(
		applications.map((application) => application.name),
	);
	const pairs = new Set();
	const relationships = input.relationships.map((rawRelationship, index) => {
		const path = `relationships[${index}]`;
		const relationship = object(rawRelationship, path);
		exactKeys(relationship, ["from", "to", "description"], path);
		const from = text(relationship.from, `${path}.from`);
		const to = text(relationship.to, `${path}.to`);
		if (!applicationNames.has(from)) {
			fail(`${path}.from references an unknown application`);
		}
		if (!applicationNames.has(to)) {
			fail(`${path}.to references an unknown application`);
		}
		if (from === to) fail(`${path} must connect two different applications`);
		const pair = `${from}\0${to}`;
		if (pairs.has(pair)) fail(`Duplicate relationship: ${from} -> ${to}`);
		pairs.add(pair);
		return {
			from,
			to,
			description: text(relationship.description, `${path}.description`),
		};
	});

	return { title, definition, terms, applications, relationships };
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
		loadAsset("gitignore"),
		readFile(resolve(scriptDirectory, "repo-state.mjs"), "utf8"),
		loadAsset("tooling/project-progress.mjs"),
		loadAsset("tooling/biome.json"),
		loadAsset("tooling/tsconfig.base.json"),
		loadAsset("tooling/turbo.json"),
		loadAsset("tooling/toolchain-policy.json"),
		loadAsset("tooling/validate-fixtures.mjs"),
		loadAsset("tooling/verify-toolchain.mjs"),
		loadAsset("tooling/version-policy.mjs"),
	]);
	const [
		agents,
		claude,
		gitignore,
		repoState,
		projectProgress,
		biomeBase,
		tsconfig,
		turbo,
		policySource,
		fixtureValidator,
		toolchainVerifier,
		versionPolicy,
	] = assets;
	const policy = JSON.parse(policySource);
	const biome = biomeBase.replace(
		"{\n",
		`{\n\t"$schema": "https://biomejs.dev/schemas/${policy.minimumToolVersions["@biomejs/biome"]}/schema.json",\n`,
	);
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

	const applicationTypesByName = new Map(
		input.applications.map((application) => [
			application.name,
			application.type,
		]),
	);
	const project = {
		title: input.title,
		definition: input.definition,
		terms: input.terms,
		applications: input.applications.map((application) => {
			const progress = { [`${application.type}-surface`]: "pending" };
			const connectsToApi =
				application.type === "web" &&
				input.relationships.some(
					(relationship) =>
						relationship.from === application.name &&
						applicationTypesByName.get(relationship.to) === "api",
				);
			if (connectsToApi) progress["api-connection"] = "pending";

			return {
				name: application.name,
				type: application.type,
				path: `apps/${application.folder}/`,
				responsibility: application.responsibility,
				progress,
			};
		}),
		relationships: input.relationships,
	};

	const packageJson = formattedJson({
		private: true,
		type: "module",
		workspaces: policy.requiredWorkspaces,
		scripts: {
			...policy.requiredScripts,
			check: "npm run check:project && npm run check:tooling",
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
	// Knip already skips everything .gitignore covers, which setup guarantees
	// includes dist and .turbo. Only tracked files it cannot resolve are listed.
	// This literal is written in Biome's formatting, which keeps a short array
	// on one line; `npm run check:biome` fails on the generated file otherwise.
	const knip = `{
\t"$schema": "https://unpkg.com/knip@${policy.minimumToolVersions.knip}/schema.json",
\t"ignore": [".flow/**", "apps/*/public/**/*.js"],
\t"ignoreDependencies": [
${ignoredDependencies}
\t]
}\n`;

	const files = [
		{ path: "AGENTS.md", content: agents, copiedFrom: "assets/AGENTS.md" },
		{ path: "CLAUDE.md", content: claude, copiedFrom: "assets/CLAUDE.md" },
		{
			path: ".flow/project.json",
			content: formattedJson(project),
		},
		{
			path: ".flow/tools/repo-state.mjs",
			content: repoState,
			copiedFrom: "scripts/repo-state.mjs",
			mode: 0o755,
		},
		{
			path: ".flow/tools/project-progress.mjs",
			content: projectProgress,
			copiedFrom: "assets/tooling/project-progress.mjs",
			mode: 0o755,
		},
		{
			path: ".flow/tools/validate-fixtures.mjs",
			content: fixtureValidator,
			copiedFrom: "assets/tooling/validate-fixtures.mjs",
			mode: 0o755,
		},
		{
			path: ".flow/tools/verify-toolchain.mjs",
			content: toolchainVerifier,
			copiedFrom: "assets/tooling/verify-toolchain.mjs",
			mode: 0o755,
		},
		{
			path: ".flow/tools/version-policy.mjs",
			content: versionPolicy,
			copiedFrom: "assets/tooling/version-policy.mjs",
		},
		{
			path: ".flow/toolchain-policy.json",
			content: policySource,
			copiedFrom: "assets/tooling/toolchain-policy.json",
		},
		{
			path: "biome.json",
			content: biome,
			copiedFrom: "assets/tooling/biome.json",
		},
		{
			path: "tsconfig.base.json",
			content: tsconfig,
			copiedFrom: "assets/tooling/tsconfig.base.json",
		},
		{
			path: "turbo.json",
			content: turbo,
			copiedFrom: "assets/tooling/turbo.json",
		},
		{ path: "knip.json", content: knip },
		{ path: "package.json", content: packageJson },
		{ path: ".node-version", content: `${nodeVersion}\n` },
		{
			path: ".gitignore",
			content: gitignore,
			copiedFrom: "assets/gitignore",
			requiredEntries: requiredIgnoreEntries(gitignore),
		},
	];

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

function ignoreEntries(content) {
	return content
		.split("\n")
		.map((line) => line.trim().replace(/\/$/, ""))
		.filter((line) => line && !line.startsWith("#"));
}

// Only the paths this toolchain generates are enforced against an existing
// .gitignore; the rest of the template is a convenience default.
function requiredIgnoreEntries(template) {
	const required = ["node_modules", "dist", ".turbo", "coverage"];
	const covered = new Set(ignoreEntries(template));
	const uncovered = required.filter((entry) => !covered.has(entry));
	if (uncovered.length) {
		fail(`assets/gitignore does not cover: ${uncovered.join(", ")}`);
	}
	return required;
}

// main has already refused any repository that is not ready for setup.
async function preflight(root, files) {
	const pending = [];

	for (const file of files) {
		if (!(await exists(resolve(root, file.path)))) {
			pending.push(file);
			continue;
		}
		if (!file.requiredEntries) {
			fail(`Output file already exists: ${file.path}`);
		}
		const present = new Set(
			ignoreEntries(await readFile(resolve(root, file.path), "utf8")),
		);
		const missing = file.requiredEntries.filter((entry) => !present.has(entry));
		if (missing.length > 0) {
			fail(
				`${file.path} must ignore ${missing.join(", ")}; add them and run setup again`,
			);
		}
	}

	return pending;
}

function preview(files) {
	const project = files.find((file) => file.path === ".flow/project.json");
	if (!project) fail(".flow/project.json is missing from setup output");
	return project.content;
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

async function writeFiles(root, files) {
	const createdFiles = [];
	const createdDirectories = [];

	try {
		await ensureDirectory(resolve(root, ".flow"), createdDirectories);
		await ensureDirectory(resolve(root, ".flow/tools"), createdDirectories);

		const ordered = [...files].sort((left, right) =>
			left.path.localeCompare(right.path),
		);

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
	const pending = await preflight(root, files);

	if (dryRun) {
		process.stdout.write(preview(files));
		return;
	}

	await writeFiles(root, pending);
	process.stdout.write(
		`${JSON.stringify({
			state: "initialized",
			files: pending.map((file) => file.path),
		})}\n`,
	);
}

main().catch((error) => {
	process.stderr.write(`${JSON.stringify({ error: error.message })}\n`);
	process.exitCode = 1;
});
