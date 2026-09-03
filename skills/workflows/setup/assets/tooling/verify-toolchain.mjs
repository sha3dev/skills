#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { assertMinimumVersion } from "./version-policy.mjs";

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

async function readText(path, label) {
	try {
		return await readFile(path, "utf8");
	} catch (error) {
		fail(`${label} is missing or unreadable: ${error.message}`);
	}
}

async function readJson(path, label) {
	try {
		return JSON.parse(await readText(path, label));
	} catch (error) {
		fail(`${label} is invalid JSON: ${error.message}`);
	}
}

function isCompetingDependency(name) {
	return new Set(["eslint", "prettier", "oxlint", "dprint"]).has(name);
}

async function findRepositoryViolations(root) {
	const ignored = new Set([
		".agents",
		".git",
		"coverage",
		"dist",
		"node_modules",
	]);
	const violations = [];

	async function visit(directory) {
		for (const entry of await readdir(directory, { withFileTypes: true })) {
			const path = join(directory, entry.name);
			if (entry.isDirectory()) {
				if (!ignored.has(entry.name)) await visit(path);
			} else {
				const repositoryPath = relative(root, path).split(sep).join("/");
				const insideApplication =
					/^apps\/[^/]+\/surface\//.test(repositoryPath) ||
					/^packages\/[^/]+\//.test(repositoryPath);
				if (/\.tsx?$/.test(entry.name) && !insideApplication) {
					violations.push(
						`TypeScript must stay under apps/<app>/surface/ or packages/<package>/: ${repositoryPath}`,
					);
				} else if (
					/\.(?:cjs|jsx|mjs)$/.test(entry.name) &&
					insideApplication
				) {
					violations.push(
						`Unsupported JavaScript extension under apps/<app>/surface/ or packages/<package>/: ${repositoryPath}`,
					);
				} else if (
					entry.name.endsWith(".js") &&
					insideApplication &&
					!/^apps\/[^/]+\/surface\/public\/.+\.js$/.test(repositoryPath)
				) {
					violations.push(
						`Opaque JavaScript must stay under apps/<app>/surface/public/: ${repositoryPath}`,
					);
				}
			}
		}
	}

	await visit(root);
	return violations.sort();
}

try {
	const root = process.cwd();
	const policy = await readJson(
		join(root, ".agents/toolchain-policy.json"),
		".agents/toolchain-policy.json",
	);
	const packageJson = await readJson(
		join(root, "package.json"),
		"package.json",
	);
	const turboJson = await readJson(join(root, "turbo.json"), "turbo.json");
	if (packageJson.type !== "module")
		fail('package.json must declare "type": "module"');
	const pinnedNode = (
		await readText(join(root, ".node-version"), ".node-version")
	).trim();
	const packageManagerMatch = /^npm@(\d+\.\d+\.\d+)$/.exec(
		packageJson.packageManager ?? "",
	);
	if (!packageManagerMatch)
		fail("packageManager must pin an exact npm version");

	const npmVersion = execFileSync("npm", ["--version"], {
		encoding: "utf8",
	}).trim();
	const minimumNode = policy.minimumRuntimeVersions.node;
	const minimumNpm = policy.minimumRuntimeVersions.npm;
	assertMinimumVersion(pinnedNode, minimumNode, "Pinned Node.js");
	assertMinimumVersion(packageManagerMatch[1], minimumNpm, "Pinned npm");
	if (process.versions.node !== pinnedNode) {
		fail(
			`Node.js must match .node-version ${pinnedNode}; received ${process.versions.node}`,
		);
	}
	if (npmVersion !== packageManagerMatch[1]) {
		fail(
			`npm must match packageManager ${packageManagerMatch[1]}; received ${npmVersion}`,
		);
	}
	if (packageJson.engines?.node !== `>=${minimumNode}`) {
		fail(`engines.node must be >=${minimumNode}`);
	}
	if (
		JSON.stringify(packageJson.workspaces) !==
		JSON.stringify(policy.requiredWorkspaces)
	) {
		fail("package.json workspaces do not match the toolchain policy");
	}
	if (
		turboJson.tasks?.dev?.cache !== false ||
		turboJson.tasks?.dev?.persistent !== true ||
		!turboJson.tasks?.build?.dependsOn?.includes("^build") ||
		!turboJson.tasks?.build?.outputs?.includes("dist/**")
	) {
		fail("turbo.json is missing the required dev or build task");
	}
	const repositoryViolations = await findRepositoryViolations(root);
	if (repositoryViolations.length > 0) {
		fail(repositoryViolations.join("; "));
	}
	for (const group of [
		"dependencies",
		"devDependencies",
		"optionalDependencies",
		"peerDependencies",
	]) {
		for (const name of Object.keys(packageJson[group] ?? {})) {
			if (isCompetingDependency(name)) {
				fail(`Unsupported dependency ${name} in ${group}`);
			}
		}
	}
	for (const [name, command] of Object.entries(policy.requiredScripts)) {
		if (packageJson.scripts?.[name] !== command) {
			fail(`package.json script ${name} must be: ${command}`);
		}
	}
	const checkSteps = (packageJson.scripts?.check ?? "")
		.split("&&")
		.map((step) => step.trim());
	for (const step of ["npm run check:project", "npm run check:tooling"]) {
		if (!checkSteps.includes(step)) {
			fail(`package.json script check must run ${step}`);
		}
	}

	for (const [group, minimumVersions] of [
		["dependencies", policy.minimumDependencyVersions],
		["devDependencies", policy.minimumPlatformDevDependencyVersions],
		["devDependencies", policy.minimumToolVersions],
	]) {
		for (const [name, minimum] of Object.entries(minimumVersions)) {
			if (!packageJson[group]?.[name]) fail(`Missing ${group} entry ${name}`);
			const installedPackage = await readJson(
				join(root, "node_modules", name, "package.json"),
				`installed ${name}`,
			);
			assertMinimumVersion(installedPackage.version, minimum, name);
		}
	}

	process.stdout.write(
		`${JSON.stringify({
			status: "valid",
			node: pinnedNode,
			npm: packageManagerMatch[1],
		})}\n`,
	);
} catch (error) {
	fail(error.message);
}
