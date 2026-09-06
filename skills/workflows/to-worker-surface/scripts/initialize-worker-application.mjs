#!/usr/bin/env node

import { readFileSync } from "node:fs";
import {
	fail,
	scaffoldApplication,
} from "../../setup/scripts/application-scaffold.mjs";

const asset = (name) =>
	readFileSync(new URL(`../assets/${name}`, import.meta.url), "utf8");

function files({ application, dependency, previewPort, workspaceName }) {
	const packageJson = {
		name: workspaceName,
		private: true,
		type: "module",
		scripts: {
			dev: "tsx watch src/server.ts",
			start: "tsx src/server.ts",
			test: 'tsx --test "src/**/*.test.ts"',
			typecheck: "tsc --noEmit --project tsconfig.json",
		},
		dependencies: { fastify: dependency("dependencies", "fastify") },
		devDependencies: Object.fromEntries(
			["@types/node", "tsx", "typescript"].map((name) => [
				name,
				dependency("devDependencies", name),
			]),
		),
	};
	return new Map([
		["package.json", `${JSON.stringify(packageJson, null, "\t")}\n`],
		[
			"tsconfig.json",
			`{
\t"extends": "../../tsconfig.base.json",
\t"compilerOptions": {
\t\t"lib": ["ES2024"],
\t\t"types": ["node"]
\t},
\t"include": ["src"]
}
`,
		],
		[
			"src/contract.ts",
			`import type { WorkerContract } from "./contract-types";

export const contract: WorkerContract = {
\tname: ${JSON.stringify(application.name)},
\tpurpose: ${JSON.stringify(application.responsibility)},
\tconfigurationSource: "",
\tconfigurationApplies: "",
\tconfiguration: {},
\tprocesses: [],
};
`,
		],
		["src/contract-types.ts", asset("contract-types.ts")],
		["src/render.ts", asset("render.ts")],
		["src/app.ts", asset("app.ts")],
		["src/tests/contract.test.ts", asset("contract.test.ts")],
		["public/reference.css", asset("reference.css")],
		[
			"src/server.ts",
			`import { buildApp } from "./app";\n\nconst app = buildApp();\nawait app.listen({ host: "127.0.0.1", port: ${previewPort} });\n`,
		],
	]);
}

try {
	await scaffoldApplication({
		type: "worker",
		typeLabel: "a worker application",
		phase: "worker-surface",
		firstPreviewPort: 4500,
		portSource: { path: "src/server.ts", pattern: /\bport:\s*(\d+)/ },
		files,
	});
} catch (error) {
	fail(error.message);
}
