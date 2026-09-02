#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import {
	access,
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const promotedBuckets = ["engineering", "productivity"];
const nonPromotedBuckets = ["misc", "in-progress", "deprecated"];

function assert(condition, message) {
	if (!condition) throw new Error(message);
}

function commandFails(command, args, options = {}) {
	try {
		execFileSync(command, args, { ...options, stdio: "pipe" });
		return false;
	} catch {
		return true;
	}
}

async function directories(path) {
	return (await readdir(path, { withFileTypes: true }))
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();
}

async function exists(path) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

function canonicalBlock(source, name) {
	const section = source
		.split(`<canonical-block name="${name}">`)[1]
		?.split("</canonical-block>")[0];
	return section?.match(/```[^\n]*\n([\s\S]*?)\n```/)?.[1];
}

async function checkSkill(skillRoot, name) {
	const skill = await readFile(join(skillRoot, "SKILL.md"), "utf8");
	const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/)?.[1];
	assert(frontmatter, `${name} has invalid frontmatter`);
	assert(
		new RegExp(`^name:\\s*${name}$`, "m").test(frontmatter),
		`${name} frontmatter name does not match its folder`,
	);
	assert(/^description:\s*\S/m.test(frontmatter), `${name} has no description`);

	const metadata = await readFile(
		join(skillRoot, "agents/openai.yaml"),
		"utf8",
	);
	const claudeExplicit = /^disable-model-invocation:\s*true$/m.test(
		frontmatter,
	);
	const codexExplicit = /^\s*allow_implicit_invocation:\s*false$/m.test(
		metadata,
	);
	assert(
		claudeExplicit === codexExplicit,
		`Invocation policy differs for ${name}`,
	);
}

async function checkCatalog() {
	const plugin = JSON.parse(
		await readFile(join(repo, ".claude-plugin/plugin.json"), "utf8"),
	);
	const expectedPluginSkills = [];
	const skillNames = new Set();
	const rootReadme = await readFile(join(repo, "README.md"), "utf8");

	for (const bucket of promotedBuckets) {
		const bucketRoot = join(repo, "skills", bucket);
		const bucketReadme = await readFile(join(bucketRoot, "README.md"), "utf8");

		for (const name of await directories(bucketRoot)) {
			const skillRoot = join(bucketRoot, name);
			const skillPath = join(skillRoot, "SKILL.md");
			if (!(await exists(skillPath))) continue;

			assert(!skillNames.has(name), `Duplicate skill name: ${name}`);
			skillNames.add(name);
			expectedPluginSkills.push(`./skills/${bucket}/${name}`);
			assert(
				bucketReadme.includes(`[\`${name}\`](./${name})`),
				`${bucket} README does not list ${name}`,
			);
			assert(
				rootReadme.includes(`(./docs/${bucket}/${name}.md)`),
				`Top-level README does not list ${name}`,
			);
			await checkSkill(skillRoot, name);

			const docs = await readFile(
				join(repo, "docs", bucket, `${name}.md`),
				"utf8",
			);
			for (const heading of [
				"## What it does",
				"## When to reach for it",
				"## It's working if",
				"## Where it fits",
			]) {
				assert(docs.includes(heading), `${name} docs are missing ${heading}`);
			}
			assert(
				!/^## Install$/m.test(docs),
				`${name} docs contain install instructions`,
			);
			assert(
				!docs.includes("npx skills"),
				`${name} docs contain install commands`,
			);
		}
	}

	for (const bucket of nonPromotedBuckets) {
		const bucketRoot = join(repo, "skills", bucket);
		const bucketReadme = await readFile(join(bucketRoot, "README.md"), "utf8");

		for (const name of await directories(bucketRoot)) {
			if (!(await exists(join(bucketRoot, name, "SKILL.md")))) continue;
			assert(!skillNames.has(name), `Duplicate skill name: ${name}`);
			skillNames.add(name);
			await checkSkill(join(bucketRoot, name), name);
			assert(
				bucketReadme.includes(`[\`${name}\`](./${name})`),
				`${bucket} README does not list ${name}`,
			);
			assert(
				!rootReadme.includes(`skills/${bucket}/${name}`),
				`Top-level README promotes ${name}`,
			);
			assert(
				!(await exists(join(repo, "docs", bucket, `${name}.md`))),
				`Non-promoted skill ${name} has a docs page`,
			);
		}
	}

	assert(
		JSON.stringify([...plugin.skills].sort()) ===
			JSON.stringify(expectedPluginSkills.sort()),
		"Plugin skills do not match promoted skills",
	);

	assert(
		(await readFile(join(repo, "CLAUDE.md"), "utf8")) === "@AGENTS.md\n",
		"CLAUDE.md must contain only @AGENTS.md",
	);

	const installBlock = await readFile(
		join(repo, ".agents/install-block.md"),
		"utf8",
	);
	for (const name of ["claude-code", "skills-sh-whole-set"]) {
		const block = canonicalBlock(installBlock, name);
		assert(
			block && rootReadme.includes(block),
			`README installation block differs: ${name}`,
		);
	}
}

async function checkSetup() {
	const temporary = await mkdtemp(join(tmpdir(), "sha3dev-skills-check-"));
	const target = join(temporary, "repository");
	const projectMarkerTarget = join(temporary, "project-marker");
	const input = join(temporary, "input.json");
	const setupRoot = join(repo, "skills/engineering/setup");

	try {
		await mkdir(join(projectMarkerTarget, ".git"), { recursive: true });
		await writeFile(
			join(projectMarkerTarget, "PROJECT.md"),
			"# Existing project\n",
		);
		const projectMarkerState = JSON.parse(
			execFileSync(
				process.execPath,
				[
					join(setupRoot, "scripts/repo-state.mjs"),
					"--root",
					projectMarkerTarget,
				],
				{ encoding: "utf8" },
			),
		);
		assert(
			projectMarkerState.state === "already_initialized" &&
				projectMarkerState.markers.includes("PROJECT.md"),
			"PROJECT.md is not the canonical setup state marker",
		);

		await mkdir(join(target, ".git"), { recursive: true });
		const setupInput = {
			title: "Example Project",
			definition:
				"Build a focused product for its primary users while keeping solution boundaries explicit.",
			terms: [
				{
					term: "Member",
					definition: "A person who uses the application.",
				},
				{
					term: "Operator",
					definition: "A person who manages the application.",
				},
			],
			blocks: [
				{
					name: "Web Application",
					responsibility: "Own the user-facing experience.",
					type: "web",
				},
				{
					name: "Editorial API",
					responsibility: "Provide editorial content.",
					type: "api",
				},
			],
			relationships: [
				{
					from: "Web Application",
					to: "Editorial API",
					description: "Requests editorial content.",
				},
			],
		};
		await writeFile(input, JSON.stringify(setupInput));

		const initializer = join(setupRoot, "scripts/initialize-repository.mjs");
		const args = [initializer, "--root", target, "--input", input];
		await writeFile(
			input,
			JSON.stringify({
				...setupInput,
				relationships: [
					{
						from: "Application",
						to: "Missing block",
						description: "Cannot resolve this interaction.",
					},
				],
			}),
		);
		assert(
			commandFails(process.execPath, [...args, "--dry-run"]),
			"Setup accepted a relationship to an unknown block",
		);
		await writeFile(
			input,
			JSON.stringify({
				...setupInput,
				blocks: setupInput.blocks.map((block, index) =>
					index === 0 ? { ...block, type: "web-api" } : block,
				),
			}),
		);
		assert(
			commandFails(process.execPath, [...args, "--dry-run"]),
			"Setup accepted a hybrid repository block type",
		);
		await writeFile(input, JSON.stringify({ ...setupInput, terms: [] }));
		assert(
			!commandFails(process.execPath, [...args, "--dry-run"]),
			"Setup rejected an empty domain language",
		);
		await writeFile(input, JSON.stringify(setupInput));
		const preview = execFileSync(process.execPath, [...args, "--dry-run"], {
			encoding: "utf8",
		});
		assert(
			preview.startsWith("# Example Project\n") &&
				preview.includes("`src/web-application/`"),
			"Setup preview is not the generated PROJECT.md",
		);
		execFileSync(process.execPath, [...args, "--write"]);

		const state = JSON.parse(
			execFileSync(
				process.execPath,
				[join(target, ".agents/tools/repo-state.mjs"), "--root", target],
				{ encoding: "utf8" },
			),
		);
		assert(
			state.state === "already_initialized",
			"Setup state is not initialized",
		);
		assert(
			(await readFile(join(target, "CLAUDE.md"), "utf8")) === "@AGENTS.md\n",
			"Setup generated an invalid CLAUDE.md",
		);
		const project = await readFile(join(target, "PROJECT.md"), "utf8");
		assert(
			project.includes("**Web Application**") &&
				project.includes("`web`") &&
				project.includes("`src/web-application/`") &&
				project.includes("Own the user-facing experience."),
			"PROJECT.md does not own repository block facts",
		);
		assert(
			project.includes(
				"**Web Application** → **Editorial API** — Requests editorial content.",
			),
			"PROJECT.md does not render logical relationships",
		);
		assert(
			project.includes("**Member**:\nA person who uses the application."),
			"PROJECT.md does not render domain language",
		);

		const packageJson = JSON.parse(
			await readFile(join(target, "package.json"), "utf8"),
		);
		assert(
			packageJson.type === "module",
			"TypeScript tooling did not enable ESM",
		);
		for (const name of ["fastify", "react", "react-dom"]) {
			assert(
				packageJson.dependencies[name],
				`Setup omitted platform dependency ${name}`,
			);
		}
		for (const name of ["tsx", "vite", "@vitejs/plugin-react"]) {
			assert(
				packageJson.devDependencies[name],
				`Setup omitted platform devDependency ${name}`,
			);
		}
		assert(
			packageJson.scripts["check:tooling"] ===
				"npm run check:toolchain && npm run check:biome && npm run typecheck && npm run check:knip",
			"TypeScript tooling gate is incomplete",
		);

		await symlink(
			join(repo, "node_modules"),
			join(target, "node_modules"),
			"dir",
		);

		const verifier = join(target, ".agents/tools/verify-toolchain.mjs");
		const validation = JSON.parse(
			execFileSync(process.execPath, [verifier], {
				cwd: target,
				encoding: "utf8",
			}),
		);
		assert(validation.status === "valid", "Generated toolchain is not valid");

		const packagePath = join(target, "package.json");
		const verifierRejects = () =>
			commandFails(process.execPath, [verifier], { cwd: target });

		packageJson.type = "commonjs";
		await writeFile(
			packagePath,
			`${JSON.stringify(packageJson, null, "\t")}\n`,
		);
		assert(verifierRejects(), "Toolchain accepted CommonJS package type");
		packageJson.type = "module";
		await writeFile(
			packagePath,
			`${JSON.stringify(packageJson, null, "\t")}\n`,
		);

		packageJson.devDependencies.prettier = "1.0.0";
		await writeFile(
			packagePath,
			`${JSON.stringify(packageJson, null, "\t")}\n`,
		);
		assert(
			verifierRejects(),
			"Toolchain accepted competing dependency prettier",
		);
		delete packageJson.devDependencies.prettier;
		await writeFile(
			packagePath,
			`${JSON.stringify(packageJson, null, "\t")}\n`,
		);

		const policyPath = join(target, ".agents/toolchain-policy.json");
		const canonicalPolicy = await readFile(policyPath, "utf8");
		const policy = JSON.parse(canonicalPolicy);
		policy.minimumToolVersions.knip = "999.0.0";
		await writeFile(policyPath, `${JSON.stringify(policy, null, "\t")}\n`);
		assert(
			verifierRejects(),
			"Toolchain accepted a dependency below its minimum",
		);
		await writeFile(policyPath, canonicalPolicy);

		await writeFile(
			join(target, "outside.ts"),
			"export const outside = true;\n",
		);
		assert(
			verifierRejects(),
			"Toolchain verification accepted TypeScript outside src/",
		);
		await rm(join(target, "outside.ts"));
		await mkdir(join(target, "src/web-application"), { recursive: true });

		for (const filename of ["legacy.js", "module.mjs"]) {
			const unsupportedSource = join(target, "src/web-application", filename);
			await writeFile(unsupportedSource, "window.legacy = true;\n");
			assert(
				verifierRejects(),
				`Toolchain verification accepted unsupported source ${filename}`,
			);
			await rm(unsupportedSource);
		}

		const source = join(target, "src/web-application/index.ts");
		await writeFile(source, "export const answer = 42;\n");
		packageJson.main = "src/web-application/index.ts";
		await writeFile(
			join(target, "package.json"),
			`${JSON.stringify(packageJson, null, "\t")}\n`,
		);
		const opaqueAsset = join(target, "src/web-application/assets/vendor.js");
		const opaqueAssetContents = "window.vendor={answer:42};\n";
		await mkdir(dirname(opaqueAsset), { recursive: true });
		await writeFile(opaqueAsset, opaqueAssetContents);
		await writeFile(
			join(target, "skills-lock.json"),
			`${JSON.stringify(
				{
					version: 1,
					skills: {
						setup: {
							source: "sha3dev/skills",
							sourceType: "github",
						},
					},
				},
				null,
				2,
			)}\n`,
		);

		const binary = (name) => join(repo, "node_modules", ".bin", name);
		execFileSync(binary("biome"), ["check", "."], {
			cwd: target,
			stdio: "pipe",
		});
		execFileSync(binary("tsc"), ["--noEmit", "--project", "tsconfig.json"], {
			cwd: target,
			stdio: "pipe",
		});
		execFileSync(binary("knip"), [], { cwd: target, stdio: "pipe" });
		execFileSync("npm", ["run", "check"], { cwd: target, stdio: "pipe" });
		assert(
			(await readFile(opaqueAsset, "utf8")) === opaqueAssetContents,
			"Code tooling modified an opaque JavaScript asset",
		);

		const biomeViolation = join(target, "src/web-application/debugger.ts");
		await writeFile(biomeViolation, "debugger;\n");
		assert(
			commandFails(binary("biome"), ["check", biomeViolation], { cwd: target }),
			"Biome accepted a recommended-rule violation",
		);
		await rm(biomeViolation);

		const brokenSource = join(target, "src/web-application/broken.ts");
		await writeFile(brokenSource, "const count: string = 42;\n");
		assert(
			commandFails(binary("tsc"), ["--noEmit", "--project", "tsconfig.json"], {
				cwd: target,
			}),
			"TypeScript gate did not inspect src/ code",
		);
		await rm(brokenSource);

		const unusedSource = join(target, "src/web-application/unused.ts");
		await writeFile(unusedSource, "export const unused = true;\n");
		assert(
			commandFails(binary("knip"), [], { cwd: target }),
			"Knip gate accepted an unused source file",
		);
	} finally {
		await rm(temporary, { recursive: true, force: true });
	}
}

await checkCatalog();
await checkSetup();
console.log("Repository checks passed");
