#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, rmdir, stat, writeFile } from "node:fs/promises";
import { basename, join, relative, resolve, sep } from "node:path";

const previewPort = 4300;

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
	const applicationName = option(args, "--app");
	const progressTool = join(root, ".flow/tools/project-progress.mjs");
	const result = JSON.parse(
		execFileSync(
			process.execPath,
			[progressTool, "--root", root, "--app", applicationName],
			{ encoding: "utf8" },
		),
	);
	const application = result.applications?.[0];
	if (application?.type !== "web") {
		fail(`${applicationName} is not a web application`);
	}
	if (
		!application.progress ||
		!["pending", "in-progress"].includes(application.progress["web-surface"])
	) {
		fail(`${application.name} web-surface is not open for initialization`);
	}

	const applicationRoot = resolve(root, application.path);
	const repositoryPath = relative(root, applicationRoot).split(sep).join("/");
	if (!/^apps\/[^/]+$/.test(repositoryPath)) {
		fail(`Invalid application path: ${application.path}`);
	}
	const workspacePath = `${repositoryPath}/`;
	const sourceRoot = join(applicationRoot, "src");
	const previewUrl = `http://localhost:${previewPort}/`;
	const packagePath = join(applicationRoot, "package.json");
	if (await exists(packagePath)) {
		const existingPackage = JSON.parse(await readFile(packagePath, "utf8"));
		process.stdout.write(
			`${JSON.stringify({ status: "already-initialized", application: application.name, path: workspacePath, workspace: existingPackage.name, url: previewUrl })}\n`,
		);
		process.exit(0);
	}
	if (await exists(sourceRoot)) {
		fail(`Application source path already exists: ${workspacePath}src/`);
	}
	const applicationRootExisted = await exists(applicationRoot);

	const rootPackage = JSON.parse(
		await readFile(join(root, "package.json"), "utf8"),
	);
	const slug = basename(applicationRoot);
	const packageJson = {
		name: `@apps/${slug}`,
		private: true,
		type: "module",
		scripts: {
			build: "vite build",
			dev: "vite",
			preview: "vite preview",
			typecheck: "tsc --noEmit --project tsconfig.json",
		},
		dependencies: {
			react: dependency(rootPackage, "dependencies", "react"),
			"react-dom": dependency(rootPackage, "dependencies", "react-dom"),
		},
		devDependencies: {
			typescript: dependency(rootPackage, "devDependencies", "typescript"),
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
	const tsconfig = `{
\t"extends": "../../tsconfig.base.json",
\t"compilerOptions": {
\t\t"jsx": "react-jsx",
\t\t"lib": ["ES2024", "DOM", "DOM.Iterable"]
\t},
\t"include": ["src", "vite.config.ts"]
}
`;
	const files = new Map([
		["package.json", `${JSON.stringify(packageJson, null, "\t")}\n`],
		["tsconfig.json", tsconfig],
		[
			"index.html",
			`<!doctype html>\n<html lang="en">\n\t<head>\n\t\t<meta charset="UTF-8" />\n\t\t<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n\t\t<title>${html(application.name)}</title>\n\t</head>\n\t<body>\n\t\t<div id="root"></div>\n\t\t<script type="module" src="/src/main.tsx"></script>\n\t</body>\n</html>\n`,
		],
		[
			"vite.config.ts",
			`import react from "@vitejs/plugin-react";\nimport { defineConfig } from "vite";\n\nexport default defineConfig({\n\tplugins: [react()],\n\tserver: { port: ${previewPort}, strictPort: true },\n});\n`,
		],
		[
			"src/App.tsx",
			`export function App() {\n\treturn (\n\t\t<main>\n\t\t\t<h1>{${JSON.stringify(application.name)}}</h1>\n\t\t</main>\n\t);\n}\n`,
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

	for (const path of files.keys()) {
		if (await exists(join(applicationRoot, path))) {
			fail(`Application file already exists: ${workspacePath}${path}`);
		}
	}

	const createdFiles = [];
	let sourceRootCreated = false;
	await mkdir(applicationRoot, { recursive: true });
	try {
		await mkdir(sourceRoot);
		sourceRootCreated = true;
		for (const [path, content] of files) {
			const target = join(applicationRoot, path);
			await writeFile(target, content, { flag: "wx" });
			createdFiles.push(target);
		}
	} catch (error) {
		for (const path of createdFiles.reverse()) {
			await rm(path, { force: true });
		}
		if (sourceRootCreated) await rmdir(sourceRoot).catch(() => {});
		if (!applicationRootExisted) await rmdir(applicationRoot).catch(() => {});
		throw error;
	}

	process.stdout.write(
		`${JSON.stringify({ status: "initialized", application: application.name, path: workspacePath, workspace: packageJson.name, url: previewUrl })}\n`,
	);
} catch (error) {
	fail(error.message);
}
