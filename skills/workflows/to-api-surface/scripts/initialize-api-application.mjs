#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, rmdir, stat, writeFile } from "node:fs/promises";
import { basename, join, relative, resolve, sep } from "node:path";

const previewPort = 4400;

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
	if (application?.type !== "api") {
		fail(`${applicationName} is not an API application`);
	}
	if (
		!application.progress ||
		!["pending", "in-progress"].includes(application.progress["api-surface"])
	) {
		fail(`${application.name} api-surface is not open for initialization`);
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
			dev: "tsx watch src/server.ts",
			start: "tsx src/server.ts",
			test: 'tsx --test "src/**/*.test.ts"',
			typecheck: "tsc --noEmit --project tsconfig.json",
		},
		dependencies: {
			"@fastify/swagger": dependency(
				rootPackage,
				"dependencies",
				"@fastify/swagger",
			),
			fastify: dependency(rootPackage, "dependencies", "fastify"),
		},
		devDependencies: {
			"@types/node": dependency(rootPackage, "devDependencies", "@types/node"),
			tsx: dependency(rootPackage, "devDependencies", "tsx"),
			typescript: dependency(rootPackage, "devDependencies", "typescript"),
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
	const files = new Map([
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
		await mkdir(join(sourceRoot, "tests"));
		for (const [path, content] of files) {
			const target = join(applicationRoot, path);
			await writeFile(target, content, { flag: "wx" });
			createdFiles.push(target);
		}
	} catch (error) {
		for (const path of createdFiles.reverse()) {
			await rm(path, { force: true });
		}
		await rmdir(join(sourceRoot, "tests")).catch(() => {});
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
