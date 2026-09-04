#!/usr/bin/env node

// Workspace shape, validation and write semantics are shared with the web
// initializer; see the module for why it lives in `setup`.
import {
	fail,
	scaffoldApplication,
} from "../../setup/scripts/application-scaffold.mjs";

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
		dependencies: {
			"@fastify/swagger": dependency("dependencies", "@fastify/swagger"),
			fastify: dependency("dependencies", "fastify"),
		},
		devDependencies: {
			"@types/node": dependency("devDependencies", "@types/node"),
			tsx: dependency("devDependencies", "tsx"),
			typescript: dependency("devDependencies", "typescript"),
		},
	};
	const tsconfig = `{
\t"extends": "../../tsconfig.base.json",
\t"compilerOptions": {
\t\t"lib": ["ES2024"],
\t\t"types": ["node"]
\t},
\t"include": ["src"]
}
`;
	return new Map([
		["package.json", `${JSON.stringify(packageJson, null, "\t")}\n`],
		["tsconfig.json", tsconfig],
		[
			"src/app.ts",
			`import swagger from "@fastify/swagger";
import Fastify from "fastify";

export async function buildApp() {
\tconst app = Fastify({ logger: false });

\tawait app.register(swagger, {
\t\topenapi: {
\t\t\tinfo: {
\t\t\t\ttitle: ${JSON.stringify(application.name)},
\t\t\t\tversion: "0.1.0",
\t\t\t},
\t\t},
\t});

\tapp.get(
\t\t"/health",
\t\t{
\t\t\tschema: {
\t\t\t\tresponse: {
\t\t\t\t\t200: {
\t\t\t\t\t\ttype: "object",
\t\t\t\t\t\tadditionalProperties: false,
\t\t\t\t\t\trequired: ["status"],
\t\t\t\t\t\tproperties: {
\t\t\t\t\t\t\tstatus: { type: "string", enum: ["ok"] },
\t\t\t\t\t\t},
\t\t\t\t\t},
\t\t\t\t},
\t\t\t},
\t\t},
\t\tasync () => ({ status: "ok" }),
\t);

\tapp.get(
\t\t"/openapi.json",
\t\t{ schema: { hide: true } },
\t\tasync (_request, reply) => reply.send(app.swagger()),
\t);

\treturn app;
}
`,
		],
		[
			"src/server.ts",
			`import { buildApp } from "./app";

const app = await buildApp();
await app.listen({ host: "127.0.0.1", port: ${previewPort} });
`,
		],
		[
			"src/tests/app.test.ts",
			`import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../app";

test("exposes health and OpenAPI contracts", async (context) => {
\tconst app = await buildApp();
\tcontext.after(async () => app.close());

\tconst health = await app.inject({ method: "GET", url: "/health" });
\tassert.equal(health.statusCode, 200);
\tassert.deepEqual(health.json(), { status: "ok" });

\tconst openapi = await app.inject({ method: "GET", url: "/openapi.json" });
\tassert.equal(openapi.statusCode, 200);
\tassert.ok(openapi.json().paths["/health"]);
});
`,
		],
	]);
}

try {
	await scaffoldApplication({
		type: "api",
		typeLabel: "an API application",
		phase: "api-surface",
		firstPreviewPort: 4400,
		portSource: { path: "src/server.ts", pattern: /\bport:\s*(\d+)/ },
		files,
	});
} catch (error) {
	fail(error.message);
}
