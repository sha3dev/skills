#!/usr/bin/env node

// Workspace shape, validation and write semantics are shared with the web
// initializer; see the module for why it lives in `setup`.
import { readFileSync } from "node:fs";
import {
	fail,
	scaffoldApplication,
} from "../../setup/scripts/application-scaffold.mjs";

const referenceHtml = readFileSync(
	new URL("../assets/reference/index.html", import.meta.url),
	"utf8",
);
const referenceCss = readFileSync(
	new URL("../assets/reference/reference.css", import.meta.url),
	"utf8",
);
const referenceJs = readFileSync(
	new URL("../assets/reference/reference.js", import.meta.url),
	"utf8",
);

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
			`import { readFile } from "node:fs/promises";
import swagger from "@fastify/swagger";
import Fastify from "fastify";

export async function buildApp() {
\tconst app = Fastify({ logger: false });
\tconst [referenceDocument, referenceStyles, referenceScript] =
\t\tawait Promise.all([
\t\t\treadFile(
\t\t\t\tnew URL("../public/reference/index.html", import.meta.url),
\t\t\t\t"utf8",
\t\t\t),
\t\t\treadFile(
\t\t\t\tnew URL("../public/reference/reference.css", import.meta.url),
\t\t\t\t"utf8",
\t\t\t),
\t\t\treadFile(
\t\t\t\tnew URL("../public/reference/reference.js", import.meta.url),
\t\t\t\t"utf8",
\t\t\t),
\t\t]);

\tawait app.register(swagger, {
\t\topenapi: {
\t\t\tinfo: {
\t\t\t\ttitle: ${JSON.stringify(application.name)},
\t\t\t\tdescription: ${JSON.stringify(application.responsibility)},
\t\t\t\tversion: "0.1.0",
\t\t\t},
\t\t},
\t});

\tapp.get("/", { schema: { hide: true } }, async (_request, reply) =>
\t\treply.type("text/html; charset=utf-8").send(referenceDocument),
\t);

\tapp.get("/reference", { schema: { hide: true } }, async (_request, reply) =>
\t\treply.type("text/html; charset=utf-8").send(referenceDocument),
\t);

\tapp.get(
\t\t"/reference.css",
\t\t{ schema: { hide: true } },
\t\tasync (_request, reply) =>
\t\t\treply.type("text/css; charset=utf-8").send(referenceStyles),
\t);

\tapp.get(
\t\t"/reference.js",
\t\t{ schema: { hide: true } },
\t\tasync (_request, reply) =>
\t\t\treply.type("text/javascript; charset=utf-8").send(referenceScript),
\t);

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
		["public/reference/index.html", referenceHtml],
		["public/reference/reference.css", referenceCss],
		["public/reference/reference.js", referenceJs],
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

test("exposes health, OpenAPI, and the visual contract", async (context) => {
\tconst app = await buildApp();
\tcontext.after(async () => app.close());

\tconst health = await app.inject({ method: "GET", url: "/health" });
\tassert.equal(health.statusCode, 200);
\tassert.deepEqual(health.json(), { status: "ok" });

\tconst openapi = await app.inject({ method: "GET", url: "/openapi.json" });
\tassert.equal(openapi.statusCode, 200);
\tassert.ok(openapi.json().paths["/health"]);

\tconst reference = await app.inject({ method: "GET", url: "/" });
\tassert.equal(reference.statusCode, 200);
\tassert.match(reference.headers["content-type"] ?? "", /^text\\/html/);
\tassert.match(reference.body, /id="reference"/);

\tconst referenceScript = await app.inject({
\t\tmethod: "GET",
\t\turl: "/reference.js",
\t});
\tassert.equal(referenceScript.statusCode, 200);
\tassert.match(referenceScript.body, /fetch\\("\\/openapi.json"\\)/);
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
