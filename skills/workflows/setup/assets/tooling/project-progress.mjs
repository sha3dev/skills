#!/usr/bin/env node

import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import {
	activeChange,
	assertChangeStep,
	updateChange,
	validateChanges,
} from "./project-changes.mjs";

const statuses = ["pending", "in-progress", "complete"];
const applicationTypes = ["web", "api", "worker"];

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
	const normalized = value.trim();
	if (/\r|\n/.test(normalized)) fail(`${path} must be a single line`);
	return normalized;
}

function validateTerms(project) {
	if (!Array.isArray(project.terms)) {
		fail(".flow/project.json terms must be an array");
	}
	const names = new Set();
	for (const [index, entry] of project.terms.entries()) {
		const label = `terms[${index}]`;
		if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
			fail(`${label} must be an object`);
		}
		const term = nonEmptyString(entry.term, `${label}.term`);
		const normalized = term.toLocaleLowerCase("en");
		if (names.has(normalized)) fail(`Duplicate domain term: ${term}`);
		names.add(normalized);
		nonEmptyString(entry.definition, `${label}.definition`);
	}
}

function parseProject(project) {
	if (!project || typeof project !== "object" || Array.isArray(project)) {
		fail(".flow/project.json must contain an object");
	}
	nonEmptyString(project.title, "title");
	nonEmptyString(project.definition, "definition");
	validateTerms(project);
	if (
		project.progress !== undefined &&
		(!project.progress ||
			typeof project.progress !== "object" ||
			Array.isArray(project.progress) ||
			Object.entries(project.progress).some(
				([phase, status]) =>
					!["architecture-surface", "domain-surface"].includes(phase) ||
					!statuses.includes(status),
			) ||
			!project.progress["domain-surface"])
	)
		fail("project.progress must declare a valid domain-surface status");
	if (
		!Array.isArray(project.applications) ||
		project.applications.length === 0
	) {
		fail(".flow/project.json has no valid applications");
	}

	const names = new Set();
	const paths = new Set();
	const applications = project.applications.map((application, index) => {
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
			fail(`${label}.type must be web, api, or worker`);
		}
		const path = nonEmptyString(application.path, `${label}.path`);
		if (!/^apps\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(path)) {
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
	if (!Array.isArray(project.relationships)) {
		fail(".flow/project.json relationships must be an array");
	}
	const applicationsByName = new Map(
		applications.map((application) => [application.name, application]),
	);
	const connectedWebs = new Set();
	const relationshipPairs = new Set();
	for (const [index, relationship] of project.relationships.entries()) {
		const label = `relationships[${index}]`;
		if (
			!relationship ||
			typeof relationship !== "object" ||
			Array.isArray(relationship)
		) {
			fail(`${label} must be an object`);
		}
		const fromName = nonEmptyString(relationship.from, `${label}.from`);
		const toName = nonEmptyString(relationship.to, `${label}.to`);
		nonEmptyString(relationship.description, `${label}.description`);
		const from = applicationsByName.get(fromName);
		const to = applicationsByName.get(toName);
		if (!from || !to) {
			fail(`${label} references an unknown application`);
		}
		if (from === to) fail(`${label} must connect two different applications`);
		const pair = `${fromName}\0${toName}`;
		if (relationshipPairs.has(pair)) {
			fail(`Duplicate relationship: ${fromName} -> ${toName}`);
		}
		relationshipPairs.add(pair);
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
	validateChanges(project);
	return applications;
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
	const projectScope = args.includes("--project");
	if (projectScope && (applicationName || type))
		fail("--project cannot be combined with --app or --type");
	const phase = option(args, "--phase");
	const nextStatus = option(args, "--set");
	const reopen = args.includes("--reopen");
	const changeId = option(args, "--change");
	const plan = option(args, "--plan");
	const approval = option(args, "--approval");
	if (changeId && (applicationName || type || projectScope || phase || reopen))
		fail("--change cannot be combined with phase options");
	if (!changeId && (plan || approval))
		fail("--plan and --approval require --change");
	if (type && !applicationTypes.includes(type)) {
		fail("--type must be web, api, or worker");
	}
	if (!changeId && nextStatus && !statuses.includes(nextStatus)) {
		fail("--set must be pending, in-progress, or complete");
	}
	if (
		!changeId &&
		nextStatus &&
		((!applicationName && !projectScope) || !phase)
	) {
		fail("--set requires --app or --project, and --phase");
	}

	const projectPath = join(root, ".flow/project.json");
	const project = JSON.parse(await readFile(projectPath, "utf8"));
	let applications = parseProject(project);
	const before = JSON.stringify(project);
	if (changeId)
		await updateChange(project, root, {
			id: changeId,
			plan,
			status: nextStatus,
			approval,
		});
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

	if (nextStatus && !changeId) {
		assertChangeStep(project, {
			application: projectScope ? undefined : applications[0].name,
			phase,
		});
		const application = projectScope
			? { name: "Project", progress: project.progress ?? {} }
			: applications[0];
		if (
			projectScope &&
			!["architecture-surface", "domain-surface"].includes(phase)
		)
			fail("Unknown project phase");
		if (
			projectScope &&
			applications.some((app) =>
				Object.values(app.progress).some((status) => status !== "complete"),
			)
		) {
			fail(`All application phases must be complete before ${phase}`);
		}
		if (
			projectScope &&
			phase === "domain-surface" &&
			project.progress?.["architecture-surface"] !== "complete"
		)
			fail("Complete architecture-surface before domain-surface");
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
			if (
				!activeChange(project) &&
				project.progress &&
				(!projectScope || phase === "architecture-surface")
			) {
				project.progress["domain-surface"] = "pending";
				if (
					!projectScope &&
					project.progress["architecture-surface"] !== undefined
				)
					project.progress["architecture-surface"] = "pending";
			}
			if (!activeChange(project) && reopenTransition && !projectScope) {
				invalidateApiConnections(project, application, phase);
			}
		}
	}
	validateChanges(project);
	if (JSON.stringify(project) !== before) {
		const temporaryPath = join(
			dirname(projectPath),
			`.project.json.${process.pid}.tmp`,
		);
		await writeFile(temporaryPath, `${JSON.stringify(project, null, "\t")}\n`);
		await rename(temporaryPath, projectPath);
	}

	process.stdout.write(
		`${JSON.stringify({ applications, relationships: project.relationships, progress: project.progress, changes: project.changes, changeSupport: true }, null, 2)}\n`,
	);
} catch (error) {
	fail(error.message);
}
