#!/usr/bin/env node

// Workspace shape, validation and write semantics are shared with the API
// initializer; see the module for why it lives in `setup`.
import {
	fail,
	scaffoldApplication,
} from "../../setup/scripts/application-scaffold.mjs";

function html(value) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

function files({ application, dependency, previewPort, workspaceName }) {
	const packageJson = {
		name: workspaceName,
		private: true,
		type: "module",
		scripts: {
			build: "vite build",
			dev: "vite",
			preview: "vite preview",
			typecheck: "tsc --noEmit --project tsconfig.json",
		},
		dependencies: {
			react: dependency("dependencies", "react"),
			"react-dom": dependency("dependencies", "react-dom"),
		},
		devDependencies: {
			typescript: dependency("devDependencies", "typescript"),
			"@types/react": dependency("devDependencies", "@types/react"),
			"@types/react-dom": dependency("devDependencies", "@types/react-dom"),
			"@vitejs/plugin-react": dependency(
				"devDependencies",
				"@vitejs/plugin-react",
			),
			vite: dependency("devDependencies", "vite"),
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
	return new Map([
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
}

try {
	await scaffoldApplication({
		type: "web",
		typeLabel: "a web application",
		phase: "web-surface",
		firstPreviewPort: 4300,
		portSource: {
			path: "vite.config.ts",
			pattern: /server:\s*{[^}]*\bport:\s*(\d+)/,
		},
		files,
	});
} catch (error) {
	fail(error.message);
}
