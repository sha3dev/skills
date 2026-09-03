#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function option(args, name) {
	const index = args.indexOf(name);
	if (index === -1 || !args[index + 1]) fail(`Missing ${name}`);
	return args[index + 1];
}

async function exists(path) {
	try {
		await stat(path);
		return true;
	} catch (error) {
		if (error.code === "ENOENT") return false;
		throw error;
	}
}

function dependency(packageJson, group, name) {
	const version = packageJson[group]?.[name];
	if (typeof version !== "string" || !version) {
		fail(`Root package.json has no ${group} entry for ${name}`);
	}
	return version;
}

function html(value) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

try {
	const args = process.argv.slice(2);
	const root = resolve(option(args, "--root"));
	const blockName = option(args, "--block");
	const progressTool = join(root, ".agents/tools/project-progress.mjs");
	const result = JSON.parse(
		execFileSync(
			process.execPath,
			[progressTool, "--root", root, "--block", blockName],
			{ encoding: "utf8" },
		),
	);
	const block = result.blocks?.[0];
	if (block?.type !== "web") fail(`${blockName} is not a web block`);
	if (
		!block.progress ||
		!["pending", "in-progress"].includes(block.progress.surface)
	) {
		fail(`${block.name} surface is not open for initialization`);
	}

	const blockRoot = resolve(root, block.path);
	const repositoryPath = relative(root, blockRoot).split(sep).join("/");
	if (!repositoryPath.startsWith("src/") || repositoryPath.includes("..")) {
		fail(`Invalid block path: ${block.path}`);
	}
	const packagePath = join(blockRoot, "package.json");
	if (await exists(packagePath)) {
		const existingPackage = JSON.parse(await readFile(packagePath, "utf8"));
		process.stdout.write(
			`${JSON.stringify({ status: "already-initialized", block: block.name, path: block.path, workspace: existingPackage.name })}\n`,
		);
		process.exit(0);
	}
	if (await exists(blockRoot)) fail(`Block path already exists: ${block.path}`);

	const rootPackage = JSON.parse(
		await readFile(join(root, "package.json"), "utf8"),
	);
	const slug = basename(blockRoot);
	const packageJson = {
		name: `@project/${slug}`,
		private: true,
		type: "module",
		scripts: {
			build: "vite build",
			dev: "vite",
			preview: "vite preview",
		},
		dependencies: {
			react: dependency(rootPackage, "dependencies", "react"),
			"react-dom": dependency(rootPackage, "dependencies", "react-dom"),
		},
		devDependencies: {
			"@types/react": dependency(
				rootPackage,
				"devDependencies",
				"@types/react",
			),
			"@types/react-dom": dependency(
				rootPackage,
				"devDependencies",
				"@types/react-dom",
			),
			"@vitejs/plugin-react": dependency(
				rootPackage,
				"devDependencies",
				"@vitejs/plugin-react",
			),
			vite: dependency(rootPackage, "devDependencies", "vite"),
		},
	};
	const files = new Map([
		["package.json", `${JSON.stringify(packageJson, null, "\t")}\n`],
		[
			"index.html",
			`<!doctype html>\n<html lang="en">\n\t<head>\n\t\t<meta charset="UTF-8" />\n\t\t<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n\t\t<title>${html(block.name)}</title>\n\t</head>\n\t<body>\n\t\t<div id="root"></div>\n\t\t<script type="module" src="/src/main.tsx"></script>\n\t</body>\n</html>\n`,
		],
		[
			"vite.config.ts",
			`import react from "@vitejs/plugin-react";\nimport { defineConfig } from "vite";\n\nexport default defineConfig({ plugins: [react()] });\n`,
		],
		[
			"src/App.tsx",
			`export function App() {\n\treturn (\n\t\t<main>\n\t\t\t<h1>{${JSON.stringify(block.name)}}</h1>\n\t\t</main>\n\t);\n}\n`,
		],
		[
			"src/main.tsx",
			`import { StrictMode } from "react";\nimport { createRoot } from "react-dom/client";\nimport { App } from "./App";\nimport "./styles.css";\n\nconst root = document.getElementById("root");\nif (!root) throw new Error("Root element is missing");\n\ncreateRoot(root).render(\n\t<StrictMode>\n\t\t<App />\n\t</StrictMode>,\n);\n`,
		],
		[
			"src/styles.css",
			`:root {\n\tfont-family: system-ui, sans-serif;\n\tcolor: #171717;\n\tbackground: #ffffff;\n}\n\n* {\n\tbox-sizing: border-box;\n}\n\nbody {\n\tmargin: 0;\n}\n`,
		],
		["src/vite-env.d.ts", '/// <reference types="vite/client" />\n'],
	]);

	await mkdir(blockRoot, { recursive: true });
	try {
		for (const [path, content] of files) {
			const target = join(blockRoot, path);
			await mkdir(dirname(target), { recursive: true });
			await writeFile(target, content, { flag: "wx" });
		}
	} catch (error) {
		await rm(blockRoot, { recursive: true, force: true });
		throw error;
	}

	process.stdout.write(
		`${JSON.stringify({ status: "initialized", block: block.name, path: block.path, workspace: packageJson.name })}\n`,
	);
} catch (error) {
	fail(error.message);
}
