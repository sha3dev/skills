import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const skillsRoot = join(repositoryRoot, "skills");
const read = (path) => readFile(path, "utf8");

async function directories(path) {
	return (await readdir(path, { withFileTypes: true }))
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();
}

function frontmatter(source, path) {
	const match = source.match(/^---\n([\s\S]*?)\n---\n/);
	assert.ok(match, `${path} must start with YAML frontmatter`);
	const data = parse(match[1]);
	const { name, description } = data;
	assert.ok(
		typeof name === "string" && name.trim(),
		`${path} must declare name`,
	);
	assert.ok(
		typeof description === "string" && description.trim(),
		`${path} must declare description`,
	);
	assert.ok(
		data["disable-model-invocation"] === undefined ||
			data["disable-model-invocation"] === true,
		`${path} must omit invocation policy for model-invoked skills`,
	);
	return {
		explicit: data["disable-model-invocation"] === true,
		name,
	};
}

test("skill catalog, documentation, and invocation policies stay aligned", async () => {
	const readme = await read(join(repositoryRoot, "README.md"));
	const names = new Set();

	for (const category of ["workflows", "toolkit"]) {
		for (const directoryName of await directories(join(skillsRoot, category))) {
			const skillRoot = join(skillsRoot, category, directoryName);
			const skillPath = join(skillRoot, "SKILL.md");
			const metadataPath = join(skillRoot, "agents/openai.yaml");
			const docsPath = join(
				repositoryRoot,
				"docs",
				category,
				`${directoryName}.md`,
			);
			const skill = frontmatter(await read(skillPath), skillPath);
			const metadata = parse(await read(metadataPath));
			const docs = await read(docsPath);

			assert.equal(skill.name, directoryName);
			assert.ok(!names.has(skill.name), `duplicate skill name: ${skill.name}`);
			names.add(skill.name);
			assert.equal(
				metadata.policy?.allow_implicit_invocation,
				skill.explicit ? false : undefined,
				`${skill.name} invocation policies must agree`,
			);
			assert.ok(
				readme.includes(
					`[\`${skill.name}\`](./docs/${category}/${skill.name}.md)`,
				),
				`README.md is missing ${skill.name}`,
			);
			const row = readme
				.split("\n")
				.find((line) =>
					line.includes(`](./docs/${category}/${skill.name}.md)`),
				);
			assert.ok(
				row
					?.split("|")
					.map((cell) => cell.trim())
					.includes(skill.explicit ? "Explicit" : "Automatic"),
				`${skill.name} catalog mode must match its policy`,
			);
			for (const heading of [
				"## What it does",
				"## When to reach for it",
				"## It's working if",
				"## Where it fits",
			]) {
				assert.ok(docs.includes(heading), `${docsPath} is missing ${heading}`);
			}
		}
	}

	for (const category of ["workflows", "toolkit"]) {
		for (const directoryName of await directories(join(skillsRoot, category))) {
			const skillPath = join(skillsRoot, category, directoryName, "SKILL.md");
			for (const [, referencedName] of (await read(skillPath)).matchAll(
				/\$([a-z][a-z0-9-]+)/g,
			)) {
				assert.ok(
					names.has(referencedName),
					`${skillPath} references unknown skill ${referencedName}`,
				);
			}
		}
	}
});

test("relative Markdown links resolve to repository files", async () => {
	const roots = [
		join(repositoryRoot, "README.md"),
		join(repositoryRoot, "AGENTS.md"),
	];
	for (const directory of ["skills", "docs"]) {
		for (const path of await readdir(join(repositoryRoot, directory), {
			recursive: true,
		}))
			if (path.endsWith(".md"))
				roots.push(join(repositoryRoot, directory, path));
	}

	for (const sourcePath of roots) {
		for (const [, rawTarget] of (await read(sourcePath)).matchAll(
			/\[[^\]]*\]\(([^)]+)\)/g,
		)) {
			const target = rawTarget.replace(/^<|>$/g, "").split("#", 1)[0];
			if (!target || /^[a-z]+:/i.test(target)) continue;
			const resolved = resolve(dirname(sourcePath), decodeURIComponent(target));
			await assert.doesNotReject(
				access(resolved),
				`${sourcePath} links to missing file ${target}`,
			);
		}
	}
});
