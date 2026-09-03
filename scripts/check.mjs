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
	const rootReadme = await readFile(join(repo, "README.md"), "utf8");
	const skillsRoot = join(repo, "skills");

	for (const name of await directories(skillsRoot)) {
		const skillRoot = join(skillsRoot, name);
		assert(
			await exists(join(skillRoot, "SKILL.md")),
			`skills/${name} is not a skill`,
		);

		expectedPluginSkills.push(`./skills/${name}`);
		assert(
			rootReadme.includes(`(./docs/${name}.md)`),
			`Top-level README does not list ${name}`,
		);
		await checkSkill(skillRoot, name);

		const docs = await readFile(join(repo, "docs", `${name}.md`), "utf8");
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

	assert(
		JSON.stringify([...plugin.skills].sort()) ===
			JSON.stringify(expectedPluginSkills.sort()),
		"Plugin skills do not match the skill catalog",
	);

	assert(
		(await readFile(join(repo, "CLAUDE.md"), "utf8")) === "@AGENTS.md\n",
		"CLAUDE.md must contain only @AGENTS.md",
	);
}

async function checkSetup() {
	const temporary = await mkdtemp(join(tmpdir(), "sha3dev-skills-check-"));
	const target = join(temporary, "repository");
	const projectMarkerTarget = join(temporary, "project-marker");
	const input = join(temporary, "input.json");
	const setupRoot = join(repo, "skills/setup");

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
				preview.includes("- Path: `src/web-application/`") &&
				preview.includes("  - `surface`: `pending`"),
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
			state.state === "already_initialized" &&
				state.blocks.length === 2 &&
				state.blocks[0].name === "Web Application" &&
				state.blocks[0].type === "web" &&
				state.blocks[0].progress.surface === "pending",
			"Setup state does not report repository block progress",
		);
		assert(
			(await readFile(join(target, "CLAUDE.md"), "utf8")) === "@AGENTS.md\n",
			"Setup generated an invalid CLAUDE.md",
		);
		const project = await readFile(join(target, "PROJECT.md"), "utf8");
		assert(
			project.includes("### Web Application") &&
				project.includes("- Type: `web`") &&
				project.includes("- Path: `src/web-application/`") &&
				project.includes("- Responsibility: Own the user-facing experience.") &&
				project.includes("  - `surface`: `pending`"),
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
		assert(
			JSON.stringify(packageJson.workspaces) ===
				JSON.stringify(["src/*", "src/shared/*"]),
			"Setup did not configure the expected workspaces",
		);
		for (const name of ["fastify", "react", "react-dom"]) {
			assert(
				packageJson.dependencies[name],
				`Setup omitted platform dependency ${name}`,
			);
		}
		for (const name of ["tsx", "vite", "@vitejs/plugin-react", "turbo"]) {
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

		const progressTool = join(target, ".agents/tools/project-progress.mjs");
		const webBlocks = JSON.parse(
			execFileSync(
				process.execPath,
				[progressTool, "--root", target, "--type", "web"],
				{ encoding: "utf8" },
			),
		);
		assert(
			webBlocks.blocks.length === 1 &&
				webBlocks.blocks[0].progress.surface === "pending",
			"Project progress tool did not find the pending web surface",
		);
		execFileSync(process.execPath, [
			progressTool,
			"--root",
			target,
			"--block",
			"Web Application",
			"--phase",
			"surface",
			"--set",
			"in-progress",
		]);
		assert(
			(await readFile(join(target, "PROJECT.md"), "utf8")).includes(
				"  - `surface`: `in-progress`",
			),
			"Project progress tool did not update the selected phase",
		);
		const updatedState = JSON.parse(
			execFileSync(
				process.execPath,
				[join(target, ".agents/tools/repo-state.mjs"), "--root", target],
				{ encoding: "utf8" },
			),
		);
		assert(
			updatedState.blocks[0].progress.surface === "in-progress",
			"Repository state did not reflect the surface transition",
		);
		const webInitializer = join(
			repo,
			"skills/to-web-surface/scripts/initialize-web-block.mjs",
		);
		const initializedWeb = JSON.parse(
			execFileSync(
				process.execPath,
				[webInitializer, "--root", target, "--block", "Web Application"],
				{ encoding: "utf8" },
			),
		);
		assert(
			initializedWeb.status === "initialized" &&
				(await exists(join(target, "src/web-application/src/main.tsx"))),
			"Web surface initializer did not create the selected workspace",
		);
		execFileSync(
			"npm",
			["run", "build", "--workspace", initializedWeb.workspace],
			{ cwd: target, stdio: "pipe" },
		);

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
		await mkdir(join(target, "src/editorial-api"), { recursive: true });

		for (const filename of ["legacy.js", "module.mjs"]) {
			const unsupportedSource = join(target, "src/editorial-api", filename);
			await writeFile(unsupportedSource, "window.legacy = true;\n");
			assert(
				verifierRejects(),
				`Toolchain verification accepted unsupported source ${filename}`,
			);
			await rm(unsupportedSource);
		}

		const source = join(target, "src/editorial-api/index.ts");
		await writeFile(source, "export const answer = 42;\n");
		packageJson.main = "src/editorial-api/index.ts";
		await writeFile(
			join(target, "package.json"),
			`${JSON.stringify(packageJson, null, "\t")}\n`,
		);
		const opaqueAsset = join(target, "src/editorial-api/assets/vendor.js");
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

		const biomeViolation = join(target, "src/editorial-api/debugger.ts");
		await writeFile(biomeViolation, "debugger;\n");
		assert(
			commandFails(binary("biome"), ["check", biomeViolation], { cwd: target }),
			"Biome accepted a recommended-rule violation",
		);
		await rm(biomeViolation);

		const brokenSource = join(target, "src/editorial-api/broken.ts");
		await writeFile(brokenSource, "const count: string = 42;\n");
		assert(
			commandFails(binary("tsc"), ["--noEmit", "--project", "tsconfig.json"], {
				cwd: target,
			}),
			"TypeScript gate did not inspect src/ code",
		);
		await rm(brokenSource);

		const unusedSource = join(target, "src/editorial-api/unused.ts");
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
