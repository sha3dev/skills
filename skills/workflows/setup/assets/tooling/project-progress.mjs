#!/usr/bin/env node

import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const statuses = ["pending", "in-progress", "complete"];
const applicationTypes = ["web", "api", "worker"];

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function option(args, name) {
	const index = args.indexOf(name);
	return index === -1 ? undefined : args[index + 1];
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
	if (!Array.isArray(project.applications) || project.applications.length === 0) {
		fail(".flow/project.json has no valid applications");
	}

	const names = new Set();
	const paths = new Set();
	return project.applications.map((application, index) => {
		const label = `applications[${index}]`;
		if (!application || typeof application !== "object" || Array.isArray(application)) {
			fail(`${label} must be an object`);
		}
		const name = nonEmptyString(application.name, `${label}.name`);
		const normalizedName = name.toLocaleLowerCase("en");
		if (names.has(normalizedName)) fail(`Duplicate application: ${name}`);
		names.add(normalizedName);

		const type = nonEmptyString(application.type, `${label}.type`);
		if (!applicationTypes.includes(type)) {
			fail(`${label}.type must be web, api, or worker`);
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

try {
	const args = process.argv.slice(2);
	const root = resolve(option(args, "--root") ?? ".");
	const applicationName = option(args, "--app");
	const type = option(args, "--type");
	const phase = option(args, "--phase");
	const nextStatus = option(args, "--set");
	const reopen = args.includes("--reopen");
	if (type && !applicationTypes.includes(type)) {
		fail("--type must be web, api, or worker");
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
			const temporaryPath = join(
				dirname(projectPath),
				`.project.json.${process.pid}.tmp`,
			);
			await writeFile(temporaryPath, `${JSON.stringify(project, null, "\t")}\n`, {
				flag: "wx",
			});
			await rename(temporaryPath, projectPath);
		}
	}

	process.stdout.write(`${JSON.stringify({ applications }, null, 2)}\n`);
} catch (error) {
	fail(error.message);
}
