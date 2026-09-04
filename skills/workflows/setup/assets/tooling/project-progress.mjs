#!/usr/bin/env node

import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const statuses = ["pending", "in-progress", "complete"];
const applicationTypes = ["web", "api"];

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function option(args, name, fallback) {
	const index = args.indexOf(name);
	if (index === -1) return fallback;
	if (!args[index + 1]) fail(`Missing ${name}`);
	return args[index + 1];
}

function nonEmptyString(value, path) {
	if (typeof value !== "string" || !value.trim()) {
		fail(`${path} must be a non-empty string`);
	}
	return value;
}

function parseApplications(project) {
	if (!project || typeof project !== "object" || Array.isArray(project)) {
		fail(".flow/project.json must contain an object");
	}
	if (
		!Array.isArray(project.applications) ||
		project.applications.length === 0
	) {
		fail(".flow/project.json has no valid applications");
	}

	const names = new Set();
	const paths = new Set();
	return project.applications.map((application, index) => {
		const label = `applications[${index}]`;
		if (
			!application ||
			typeof application !== "object" ||
			Array.isArray(application)
		) {
			fail(`${label} must be an object`);
		}
		const name = nonEmptyString(application.name, `${label}.name`);
		const normalizedName = name.toLocaleLowerCase("en");
		if (names.has(normalizedName)) fail(`Duplicate application: ${name}`);
		names.add(normalizedName);

		const type = nonEmptyString(application.type, `${label}.type`);
		if (!applicationTypes.includes(type)) {
			fail(`${label}.type must be web or api`);
		}
		const path = nonEmptyString(application.path, `${label}.path`);
		if (!/^apps\/[^/]+\/$/.test(path)) {
			fail(`${label}.path must match apps/<app>/`);
		}
		if (paths.has(path)) fail(`Duplicate application path: ${path}`);
		paths.add(path);

		nonEmptyString(application.responsibility, `${label}.responsibility`);
		if (
			!application.progress ||
			typeof application.progress !== "object" ||
			Array.isArray(application.progress)
		) {
			fail(`${label}.progress must be an object`);
		}
		for (const [phase, status] of Object.entries(application.progress)) {
			if (!phase || !statuses.includes(status)) {
				fail(`${label}.progress contains an invalid phase or status`);
			}
		}
		const surfacePhase = `${type}-surface`;
		if (!application.progress[surfacePhase]) {
			fail(`${name} has no ${surfacePhase} phase`);
		}
		return application;
	});
}

function validateApiConnectionProgress(project, applications) {
	if (!Array.isArray(project.relationships)) {
		fail(".flow/project.json relationships must be an array");
	}
	const applicationsByName = new Map(
		applications.map((application) => [application.name, application]),
	);
	const connectedWebs = new Set();
	for (const [index, relationship] of project.relationships.entries()) {
		if (
			!relationship ||
			typeof relationship !== "object" ||
			Array.isArray(relationship)
		) {
			fail(`relationships[${index}] must be an object`);
		}
		const from = applicationsByName.get(relationship.from);
		const to = applicationsByName.get(relationship.to);
		if (!from || !to) {
			fail(`relationships[${index}] references an unknown application`);
		}
		if (from.type === "web" && to.type === "api") {
			connectedWebs.add(from.name);
		}
	}

	for (const application of applications) {
		const hasConnection = application.progress["api-connection"] !== undefined;
		const needsConnection = connectedWebs.has(application.name);
		if (needsConnection && !hasConnection) {
			fail(`${application.name} has no api-connection phase`);
		}
		if (!needsConnection && hasConnection) {
			fail(
				`${application.name} has an api-connection phase without an API relationship`,
			);
		}
	}
}

function invalidateApiConnections(project, application, phase) {
	if (phase === "web-surface" && application.type === "web") {
		if (application.progress["api-connection"] !== undefined) {
			application.progress["api-connection"] = "pending";
		}
		return;
	}
	if (phase !== "api-surface" || application.type !== "api") return;

	const applicationsByName = new Map(
		project.applications.map((candidate) => [candidate.name, candidate]),
	);
	for (const relationship of project.relationships) {
		if (relationship.to !== application.name) continue;
		const consumer = applicationsByName.get(relationship.from);
		if (
			consumer?.type === "web" &&
			consumer.progress["api-connection"] !== undefined
		) {
			consumer.progress["api-connection"] = "pending";
		}
	}
}

try {
	const args = process.argv.slice(2);
	const root = resolve(option(args, "--root", "."));
	const applicationName = option(args, "--app");
	const type = option(args, "--type");
	const phase = option(args, "--phase");
	const nextStatus = option(args, "--set");
	const reopen = args.includes("--reopen");
	if (type && !applicationTypes.includes(type)) {
		fail("--type must be web or api");
	}
	if (nextStatus && !statuses.includes(nextStatus)) {
		fail("--set must be pending, in-progress, or complete");
	}
	if (nextStatus && (!applicationName || !phase)) {
		fail("--set requires --app and --phase");
	}

	const projectPath = join(root, ".flow/project.json");
	const project = JSON.parse(await readFile(projectPath, "utf8"));
	let applications = parseApplications(project);
	validateApiConnectionProgress(project, applications);
	if (type) {
		applications = applications.filter(
			(application) => application.type === type,
		);
	}
	if (applicationName) {
		const normalized = applicationName.toLocaleLowerCase("en");
		applications = applications.filter(
			(application) => application.name.toLocaleLowerCase("en") === normalized,
		);
	}
	if (applications.length === 0) fail("No matching application");
	if (applicationName && applications.length !== 1) {
		fail("Application is not unique");
	}

	if (nextStatus) {
		const application = applications[0];
		const current = application.progress[phase];
		if (!current) fail(`${application.name} has no ${phase} phase`);
		const normalTransition =
			(current === "pending" && nextStatus === "in-progress") ||
			(current === "in-progress" && nextStatus === "complete") ||
			current === nextStatus;
		const reopenTransition =
			reopen && current === "complete" && nextStatus === "in-progress";
		if (!normalTransition && !reopenTransition) {
			fail(`Invalid ${phase} transition: ${current} -> ${nextStatus}`);
		}
		if (current !== nextStatus) {
			application.progress[phase] = nextStatus;
			if (reopenTransition) {
				invalidateApiConnections(project, application, phase);
			}
			const temporaryPath = join(
				dirname(projectPath),
				`.project.json.${process.pid}.tmp`,
			);
			await writeFile(
				temporaryPath,
				`${JSON.stringify(project, null, "\t")}\n`,
			);
			await rename(temporaryPath, projectPath);
		}
	}

	process.stdout.write(
		`${JSON.stringify({ applications, relationships: project.relationships }, null, 2)}\n`,
	);
} catch (error) {
	fail(error.message);
}
