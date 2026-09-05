import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

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
	assert.doesNotMatch(match[1], /^ *\t/m, `${path} has invalid YAML tab indentation`);
	const name = match[1].match(/^name:\s*["']?([^\n"']+)/m)?.[1]?.trim();
	const description = match[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
	assert.ok(name, `${path} must declare name`);
	assert.ok(description, `${path} must declare description`);
	return {
		explicit: /^disable-model-invocation:\s*true$/m.test(match[1]),
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
			const docsPath = join(repositoryRoot, "docs", category, `${directoryName}.md`);
			const skill = frontmatter(await read(skillPath), skillPath);
			const metadata = await read(metadataPath);
			const docs = await read(docsPath);

			assert.equal(skill.name, directoryName);
			assert.ok(!names.has(skill.name), `duplicate skill name: ${skill.name}`);
			names.add(skill.name);
			assert.equal(
				/^\s*allow_implicit_invocation:\s*false$/m.test(metadata),
				skill.explicit,
				`${skill.name} invocation policies must agree`,
			);
			assert.ok(
				readme.includes(
					`[\`${skill.name}\`](./docs/${category}/${skill.name}.md)`,
				),
				`README.md is missing ${skill.name}`,
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
	const roots = [join(repositoryRoot, "README.md")];
	for (const category of ["workflows", "toolkit"]) {
		for (const directoryName of await directories(join(skillsRoot, category))) {
			roots.push(join(skillsRoot, category, directoryName, "SKILL.md"));
			roots.push(join(repositoryRoot, "docs", category, `${directoryName}.md`));
		}
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
