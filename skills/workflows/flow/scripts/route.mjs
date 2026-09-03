#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const routesPath = fileURLToPath(new URL("../routes.json", import.meta.url));
const installedSkillsRoot = fileURLToPath(new URL("../../", import.meta.url));

function fail(message) {
	process.stderr.write(`${JSON.stringify({ error: message })}\n`);
	process.exit(1);
}

function option(args, name, fallback) {
	const index = args.indexOf(name);
	if (index === -1) return fallback;
	if (!args[index + 1]) fail(`Missing value for ${name}`);
	return args[index + 1];
}

async function exists(path) {
	try {
		await access(path, constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

async function loadRoutes() {
	let routes;
	try {
		routes = JSON.parse(await readFile(routesPath, "utf8"));
	} catch (error) {
		fail(`routes.json is unreadable: ${error.message}`);
	}
	if (typeof routes?.initialize?.skill !== "string") {
		fail("routes.json must declare initialize.skill");
	}
	if (!Array.isArray(routes.phases)) fail("routes.json must declare phases");
	for (const [index, rule] of routes.phases.entries()) {
		if (
			typeof rule?.phase !== "string" ||
			typeof rule?.skill !== "string" ||
			!Array.isArray(rule?.applicationTypes) ||
			rule.applicationTypes.length === 0
		) {
			fail(`routes.json phases[${index}] is incomplete`);
		}
	}
	return routes;
}

// A workflow may be installed in a layout this script cannot see. Report only
// what is verifiable so a missing sibling never becomes a false blocker.
async function installation(skill) {
	return (await exists(resolve(installedSkillsRoot, skill, "SKILL.md")))
		? "installed"
		: "unverified";
}

function readState(root) {
	const tool = resolve(root, ".flow/tools/repo-state.mjs");
	const result = spawnSync(process.execPath, [tool, "--root", root], {
		encoding: "utf8",
	});
	if (result.error) {
		return { error: `repo-state.mjs could not run: ${result.error.message}` };
	}
	try {
		return { state: JSON.parse(result.stdout) };
	} catch {
		return {
			error: result.stderr.trim() || "repo-state.mjs returned invalid output",
		};
	}
}

function ruleFor(routes, application, phase) {
	return routes.phases.find(
		(rule) =>
			rule.phase === phase && rule.applicationTypes.includes(application.type),
	);
}

async function decide(root, routes) {
	const stateTool = resolve(root, ".flow/tools/repo-state.mjs");
	const projectFile = resolve(root, ".flow/project.json");
	const hasStateTool = await exists(stateTool);

	if (!hasStateTool) {
		if (await exists(projectFile)) {
			return {
				decision: "blocked",
				reason: "invalid-project",
				detail:
						".flow/project.json exists but .flow/tools/repo-state.mjs is missing; the project foundation is incomplete.",
			};
		}
		const skill = routes.initialize.skill;
		return {
			decision: "run",
			skill,
			skillStatus: await installation(skill),
			reason: "uninitialized",
		};
	}

	const { state, error } = readState(root);
	if (error)
		return { decision: "blocked", reason: "state-check-failed", detail: error };

	if (state.state !== "already_initialized") {
		if (state.state === "ready_for_setup") {
			const skill = routes.initialize.skill;
			return {
				decision: "run",
				skill,
				skillStatus: await installation(skill),
				reason: "uninitialized",
			};
		}
		return { decision: "blocked", reason: "invalid-state", state };
	}

	const open = [];
	const unroutable = [];
	for (const application of state.applications ?? []) {
		for (const [phase, status] of Object.entries(application.progress ?? {})) {
			if (status !== "pending" && status !== "in-progress") continue;
			const rule = ruleFor(routes, application, phase);
			const entry = {
				application: application.name,
				type: application.type,
				path: application.path,
				phase,
				status,
			};
			if (rule) open.push({ ...entry, skill: rule.skill });
			else unroutable.push(entry);
		}
	}

	const candidates = open.some((entry) => entry.status === "in-progress")
		? open.filter((entry) => entry.status === "in-progress")
		: open;

	if (candidates.length === 1) {
		const [candidate] = candidates;
		return {
			decision: "run",
			...candidate,
			skillStatus: await installation(candidate.skill),
			unroutable,
		};
	}
	if (candidates.length > 1) {
		return {
			decision: "choose",
			candidates: await Promise.all(
				candidates.map(async (candidate) => ({
					...candidate,
					skillStatus: await installation(candidate.skill),
				})),
			),
			unroutable,
		};
	}
	if (unroutable.length > 0) {
		return {
			decision: "blocked",
			reason: "no-installed-workflow",
			unroutable,
		};
	}
	return { decision: "done", reason: "no-open-phase" };
}

async function main() {
	const args = process.argv.slice(2);
	const root = resolve(option(args, "--root", "."));
	if (!(await exists(root))) fail(`Repository root does not exist: ${root}`);
	const routes = await loadRoutes();
	process.stdout.write(`${JSON.stringify(await decide(root, routes))}\n`);
}

main().catch((error) => fail(error.message));
