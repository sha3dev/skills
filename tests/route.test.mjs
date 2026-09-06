import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
	copyFile,
	mkdir,
	mkdtemp,
	readFile,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const route = join(repositoryRoot, "skills/workflows/flow/scripts/route.mjs");
const repositoryStateTool = join(
	repositoryRoot,
	"skills/workflows/setup/scripts/repo-state.mjs",
);
const progressTool = join(
	repositoryRoot,
	"skills/workflows/setup/assets/tooling/project-progress.mjs",
);

function application(name, type, progress) {
	return {
		name,
		type,
		path: `apps/${name}/`,
		responsibility: `Serve ${name}.`,
		progress,
	};
}

// A synthetic project reaches the decision branches without setup, npm install
// or the network: route.mjs only needs a repository marker, project.json and
// the two tools it shells out to.
async function synthesize(
	t,
	{
		applications,
		relationships = [],
		repository = true,
		stateTool = true,
		projectFields = {},
	},
) {
	const root = await mkdtemp(join(tmpdir(), "sha3dev-route-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	if (repository) await mkdir(join(root, ".git"));
	await mkdir(join(root, ".flow/tools"), { recursive: true });
	if (stateTool) {
		await copyFile(
			repositoryStateTool,
			join(root, ".flow/tools/repo-state.mjs"),
		);
	}
	await copyFile(
		join(
			repositoryRoot,
			"skills/workflows/setup/assets/tooling/project-changes.mjs",
		),
		join(root, ".flow/tools/project-changes.mjs"),
	);
	await copyFile(progressTool, join(root, ".flow/tools/project-progress.mjs"));
	await writeFile(
		join(root, ".flow/project.json"),
		JSON.stringify({
			title: "Route test",
			definition: "Exercise deterministic routing.",
			terms: [],
			applications,
			relationships,
			...projectFields,
		}),
	);
	return root;
}

function routeProject(root) {
	return JSON.parse(
		execFileSync(process.execPath, [route, "--root", root], {
			encoding: "utf8",
		}),
	);
}

test("route asks for a choice when several phases are open", async (t) => {
	const root = await synthesize(t, {
		applications: [
			application("viewer-web", "web", { "web-surface": "pending" }),
			application("static-web", "web", { "web-surface": "pending" }),
		],
	});

	const decision = routeProject(root);
	assert.equal(decision.decision, "choose");
	assert.deepEqual(
		decision.candidates.map((candidate) => [
			candidate.application,
			candidate.skill,
		]),
		[
			["viewer-web", "to-web-surface"],
			["static-web", "to-web-surface"],
		],
	);
});

test("route blocks on a phase no workflow covers", async (t) => {
	const root = await synthesize(t, {
		applications: [
			application("viewer-web", "web", {
				"web-surface": "complete",
				"batch-surface": "pending",
			}),
		],
	});

	const decision = routeProject(root);
	assert.equal(decision.decision, "blocked");
	assert.equal(decision.reason, "no-installed-workflow");
	assert.deepEqual(
		decision.unroutable.map((entry) => entry.phase),
		["batch-surface"],
	);
});

test("route blocks when the repository state is unusable", async (t) => {
	const root = await synthesize(t, {
		applications: [
			application("viewer-web", "web", { "web-surface": "pending" }),
		],
		repository: false,
	});

	assert.deepEqual(routeProject(root), {
		decision: "blocked",
		reason: "invalid-state",
		state: { state: "not_repository" },
	});
});

test("route blocks when project.json has no state tool beside it", async (t) => {
	const root = await synthesize(t, {
		applications: [
			application("viewer-web", "web", { "web-surface": "pending" }),
		],
		stateTool: false,
	});

	const decision = routeProject(root);
	assert.equal(decision.decision, "blocked");
	assert.equal(decision.reason, "invalid-project");
});

test("project state rejects incomplete and unsafe durable definitions", async (t) => {
	const invalidProjects = [
		{
			name: "missing title",
			applications: [
				application("viewer-web", "web", { "web-surface": "pending" }),
			],
			projectFields: { title: undefined },
		},
		{
			name: "unsafe application path",
			applications: [
				{
					...application("viewer-web", "web", {
						"web-surface": "pending",
					}),
					path: "apps/../",
				},
			],
		},
		{
			name: "duplicate term",
			applications: [
				application("viewer-web", "web", { "web-surface": "pending" }),
			],
			projectFields: {
				terms: [
					{ term: "Viewer", definition: "A viewer." },
					{ term: "viewer", definition: "The same viewer." },
				],
			},
		},
		{
			name: "self relationship",
			applications: [
				application("viewer-web", "web", { "web-surface": "pending" }),
			],
			relationships: [
				{ from: "viewer-web", to: "viewer-web", description: "Self." },
			],
		},
		{
			name: "dangling relationship",
			applications: [
				application("viewer-web", "web", { "web-surface": "pending" }),
			],
			relationships: [
				{ from: "viewer-web", to: "missing-api", description: "Load." },
			],
		},
		{
			name: "duplicate relationship",
			applications: [
				application("viewer-web", "web", { "web-surface": "pending" }),
				application("viewer-two", "web", { "web-surface": "pending" }),
			],
			relationships: [
				{ from: "viewer-web", to: "viewer-two", description: "First." },
				{ from: "viewer-web", to: "viewer-two", description: "Again." },
			],
		},
		{
			name: "missing relationship description",
			applications: [
				application("viewer-web", "web", { "web-surface": "pending" }),
				application("viewer-two", "web", { "web-surface": "pending" }),
			],
			relationships: [
				{ from: "viewer-web", to: "viewer-two", description: "" },
			],
		},
	];

	for (const fixture of invalidProjects) {
		await t.test(fixture.name, async (subtest) => {
			const root = await synthesize(subtest, fixture);
			const decision = routeProject(root);
			assert.equal(decision.decision, "blocked");
			assert.equal(decision.reason, "invalid-state");
			assert.equal(decision.state.state, "invalid_project");
		});
	}
});

test("an invalid progress write leaves project.json unchanged", async (t) => {
	const root = await synthesize(t, {
		applications: [
			application("viewer-web", "web", { "web-surface": "pending" }),
		],
		projectFields: { definition: "invalid\nmultiline" },
	});
	const projectPath = join(root, ".flow/project.json");
	const before = await readFile(projectPath, "utf8");
	assert.throws(() =>
		execFileSync(
			process.execPath,
			[
				progressTool,
				"--root",
				root,
				"--app",
				"viewer-web",
				"--phase",
				"web-surface",
				"--set",
				"in-progress",
			],
			{ stdio: "pipe" },
		),
	);
	assert.equal(await readFile(projectPath, "utf8"), before);
});

test("domain routes only after application phases and invalidates on revision", async (t) => {
	const root = await synthesize(t, {
		applications: [application("api", "api", { "api-surface": "pending" })],
		projectFields: {
			progress: {
				"architecture-surface": "complete",
				"domain-surface": "pending",
			},
		},
	});
	const tool = join(root, ".flow/tools/project-progress.mjs");
	const transition = (...args) =>
		execFileSync(process.execPath, [tool, "--root", root, ...args], {
			encoding: "utf8",
			stdio: "pipe",
		});
	const domain = ["--project", "--phase", "domain-surface"];
	const api = ["--app", "api", "--phase", "api-surface"];
	assert.equal(routeProject(root).skill, "to-api-surface");
	const before = await readFile(join(root, ".flow/project.json"), "utf8");
	assert.throws(
		() => transition(...domain, "--set", "in-progress"),
		/All application phases/,
	);
	assert.equal(
		await readFile(join(root, ".flow/project.json"), "utf8"),
		before,
	);
	transition(...api, "--set", "in-progress");
	transition(...api, "--set", "complete");
	finishStep(root, { phase: "architecture-surface" });
	assert.equal(routeProject(root).skill, "to-domain-surface");
	assert.equal(routeProject(root).scope, "project");
	assert.throws(() => transition(...domain, "--set", "complete"), /Invalid/);
	transition(...domain, "--set", "in-progress");
	transition(...domain, "--set", "complete");
	assert.equal(routeProject(root).decision, "done");
	assert.throws(() => transition(...domain, "--set", "in-progress"), /Invalid/);
	transition(...domain, "--set", "in-progress", "--reopen");
	assert.equal(routeProject(root).skill, "to-domain-surface");
	transition(...domain, "--set", "complete");
	transition(...api, "--set", "in-progress", "--reopen");
	assert.equal(routeProject(root).skill, "to-api-surface");
	const revised = JSON.parse(
		await readFile(join(root, ".flow/project.json"), "utf8"),
	);
	assert.equal(revised.progress["domain-surface"], "pending");
});

test("domain waits for connections and workers even when domain was in progress", async (t) => {
	const root = await synthesize(t, {
		applications: [
			application("web", "web", {
				"web-surface": "complete",
				"api-connection": "pending",
			}),
			application("api", "api", { "api-surface": "complete" }),
			application("worker", "worker", { "worker-surface": "pending" }),
		],
		relationships: [{ from: "web", to: "api", description: "Use API" }],
		projectFields: { progress: { "domain-surface": "in-progress" } },
	});
	const decision = routeProject(root);
	assert.equal(decision.decision, "choose");
	assert.deepEqual(decision.candidates.map((entry) => entry.skill).sort(), [
		"connect-to-api",
		"to-worker-surface",
	]);
});

async function completedProject(t) {
	return synthesize(t, {
		applications: [
			application("web", "web", {
				"web-surface": "complete",
				"api-connection": "complete",
			}),
			application("api", "api", { "api-surface": "complete" }),
			application("worker", "worker", { "worker-surface": "complete" }),
		],
		relationships: [{ from: "web", to: "api", description: "Use API" }],
		projectFields: {
			progress: {
				"architecture-surface": "complete",
				"domain-surface": "complete",
			},
		},
	});
}
const evolutionPlan = [
	{ application: "api", phase: "api-surface" },
	{ application: "web", phase: "web-surface" },
	{ application: "web", phase: "api-connection" },
	{ phase: "architecture-surface" },
	{ phase: "domain-surface" },
];
function changeCommand(root, ...args) {
	return JSON.parse(
		execFileSync(
			process.execPath,
			[join(root, ".flow/tools/project-progress.mjs"), "--root", root, ...args],
			{ encoding: "utf8", stdio: "pipe" },
		),
	);
}
async function proposal(root, id, plan = evolutionPlan) {
	await mkdir(join(root, ".flow/changes"), { recursive: true });
	await writeFile(
		join(root, `.flow/changes/${id}.md`),
		`# ${id}\n\nAgreed behavior and acceptance criteria.\n`,
	);
	const input = join(root, "plan.json");
	await writeFile(input, JSON.stringify(plan));
	return input;
}
function finishStep(root, step) {
	const target = step.application ? ["--app", step.application] : ["--project"];
	changeCommand(root, ...target, "--phase", step.phase, "--set", "in-progress");
	changeCommand(root, ...target, "--phase", step.phase, "--set", "complete");
}

test("global changes execute approved API-first order, require integrated acceptance, and repeat", async (t) => {
	const root = await completedProject(t);
	assert.equal(routeProject(root).changeSupport, true);
	const input = await proposal(root, "feature-one");
	changeCommand(root, "--change", "feature-one", "--plan", input);
	assert.equal(routeProject(root).decision, "change");
	assert.equal(routeProject(root).change.status, "proposed");
	assert.throws(
		() =>
			changeCommand(root, "--change", "feature-one", "--set", "implementing"),
		/Invalid change transition/,
	);
	assert.throws(
		() => changeCommand(root, "--change", "feature-one", "--set", "approved"),
		/explicit human approval/,
	);
	assert.throws(
		() => finishStep(root, evolutionPlan[0]),
		/implementing change/,
	);
	assert.throws(
		() => changeCommand(root, "--change", "another", "--plan", input),
		/Only one/,
	);
	changeCommand(
		root,
		"--change",
		"feature-one",
		"--set",
		"approved",
		"--approval",
		"Approve the joint proposal",
	);
	assert.equal(routeProject(root).change.status, "approved");
	const state = changeCommand(
		root,
		"--change",
		"feature-one",
		"--set",
		"implementing",
	);
	assert.equal(state.applications[0].progress["web-surface"], "pending");
	assert.equal(state.applications[2].progress["worker-surface"], "complete");
	assert.equal(routeProject(root).skill, "to-api-surface");
	assert.throws(() => finishStep(root, evolutionPlan[1]), /next approved/);
	assert.throws(
		() => changeCommand(root, "--change", "feature-one", "--set", "in-review"),
		/Finish all phases/,
	);
	for (const step of evolutionPlan) {
		assert.equal(routeProject(root).phase, step.phase);
		finishStep(root, step);
	}
	assert.equal(routeProject(root).action, "review");
	assert.throws(
		() =>
			changeCommand(
				root,
				"--change",
				"feature-one",
				"--set",
				"complete",
				"--approval",
				"Accepted",
			),
		/Invalid change transition/,
	);
	changeCommand(root, "--change", "feature-one", "--set", "in-review");
	assert.equal(routeProject(root).change.status, "in-review");
	assert.throws(
		() => changeCommand(root, "--change", "feature-one", "--set", "complete"),
		/integrated acceptance/,
	);
	changeCommand(
		root,
		"--change",
		"feature-one",
		"--set",
		"complete",
		"--approval",
		"Accept integrated behavior",
	);
	assert.equal(routeProject(root).decision, "done");
	assert.throws(
		() => changeCommand(root, "--change", "feature-one", "--set", "proposed"),
		/immutable/,
	);
	const previous = JSON.parse(
		await readFile(join(root, ".flow/project.json"), "utf8"),
	).changes[0];
	const second = await proposal(root, "feature-two", [
		{ phase: "domain-surface" },
	]);
	changeCommand(root, "--change", "feature-two", "--plan", second);
	changeCommand(
		root,
		"--change",
		"feature-two",
		"--set",
		"approved",
		"--approval",
		"Approve architecture revision",
	);
	changeCommand(root, "--change", "feature-two", "--set", "implementing");
	finishStep(root, { phase: "domain-surface" });
	changeCommand(root, "--change", "feature-two", "--set", "in-review");
	const result = changeCommand(
		root,
		"--change",
		"feature-two",
		"--set",
		"complete",
		"--approval",
		"Accept architecture",
	);
	assert.deepEqual(result.changes[0], previous);
	assert.equal(result.changes.length, 2);
	assert.equal(routeProject(root).decision, "done");
});

test("change plans reject missing coverage, unsafe IDs, stale approval, and out-of-scope writes atomically", async (t) => {
	const root = await completedProject(t);
	for (const plan of [
		evolutionPlan.slice(0, 2),
		evolutionPlan.slice(0, 3),
		[...evolutionPlan, evolutionPlan[0]],
		[{ application: "missing", phase: "web-surface" }],
		[evolutionPlan[2], evolutionPlan[0], evolutionPlan[3]],
	]) {
		const before = await readFile(join(root, ".flow/project.json"), "utf8");
		const input = await proposal(root, "invalid", plan);
		assert.throws(() =>
			changeCommand(root, "--change", "invalid", "--plan", input),
		);
		assert.equal(
			await readFile(join(root, ".flow/project.json"), "utf8"),
			before,
		);
	}
	const input = await proposal(root, "feature");
	assert.throws(
		() => changeCommand(root, "--change", "../escape", "--plan", input),
		/Invalid change id/,
	);
	changeCommand(root, "--change", "feature", "--plan", input);
	changeCommand(
		root,
		"--change",
		"feature",
		"--set",
		"approved",
		"--approval",
		"Approved",
	);
	await writeFile(join(root, ".flow/changes/feature.md"), "Revised scope\n");
	const before = await readFile(join(root, ".flow/project.json"), "utf8");
	assert.throws(
		() => changeCommand(root, "--change", "feature", "--set", "implementing"),
		/changed after approval/,
	);
	assert.equal(
		await readFile(join(root, ".flow/project.json"), "utf8"),
		before,
	);
	changeCommand(root, "--change", "feature", "--set", "proposed");
	changeCommand(
		root,
		"--change",
		"feature",
		"--set",
		"approved",
		"--approval",
		"Approve revised scope",
	);
	changeCommand(root, "--change", "feature", "--set", "implementing");
	assert.throws(
		() =>
			changeCommand(
				root,
				"--app",
				"worker",
				"--phase",
				"worker-surface",
				"--set",
				"in-progress",
				"--reopen",
			),
		/next approved/,
	);
	finishStep(root, evolutionPlan[0]);
	changeCommand(root, "--change", "feature", "--set", "proposed");
	const shortPlan = await proposal(root, "feature", [
		{ phase: "domain-surface" },
	]);
	changeCommand(root, "--change", "feature", "--plan", shortPlan);
	assert.throws(
		() =>
			changeCommand(
				root,
				"--change",
				"feature",
				"--set",
				"approved",
				"--approval",
				"Approved",
			),
		/omits unfinished/,
	);
});

test("initial discovery remains web-first and cannot open a later change prematurely", async (t) => {
	const root = await synthesize(t, {
		applications: [
			application("web", "web", {
				"web-surface": "pending",
				"api-connection": "pending",
			}),
			application("api", "api", { "api-surface": "pending" }),
		],
		relationships: [{ from: "web", to: "api", description: "Use API" }],
		projectFields: {
			progress: {
				"architecture-surface": "complete",
				"domain-surface": "pending",
			},
		},
	});
	assert.equal(routeProject(root).skill, "to-web-surface");
	const input = await proposal(root, "feature");
	assert.throws(
		() => changeCommand(root, "--change", "feature", "--plan", input),
		/Finish initial work/,
	);
});

test("legacy state tools report absent change support without changing initial routing", async (t) => {
	const root = await completedProject(t);
	const state = changeCommand(root);
	delete state.changeSupport;
	await writeFile(
		join(root, ".flow/tools/repo-state.mjs"),
		`process.stdout.write(${JSON.stringify(JSON.stringify({ ...state, state: "already_initialized" }))});`,
	);
	const decision = routeProject(root);
	assert.equal(decision.decision, "done");
	assert.equal(decision.changeSupport, false);
});

test("architecture precedes domain independent of key order and reconciles changes", async (t) => {
	const root = await synthesize(t, {
		applications: [application("api", "api", { "api-surface": "complete" })],
		projectFields: {
			progress: {
				"domain-surface": "pending",
				"architecture-surface": "pending",
			},
		},
	});
	const architecture = { phase: "architecture-surface" };
	const domain = { phase: "domain-surface" };
	assert.equal(routeProject(root).skill, "to-architecture-surface");
	assert.throws(
		() => finishStep(root, domain),
		/Complete architecture-surface/,
	);
	finishStep(root, architecture);
	assert.equal(routeProject(root).skill, "to-domain-surface");
	finishStep(root, domain);
	assert.equal(routeProject(root).decision, "done");
	for (const plan of [
		[architecture],
		[{ application: "api", phase: "api-surface" }, domain],
		[domain, architecture],
	]) {
		const input = await proposal(root, "infra-change", plan);
		const before = await readFile(join(root, ".flow/project.json"), "utf8");
		assert.throws(
			() => changeCommand(root, "--change", "infra-change", "--plan", input),
			/Plan must/,
		);
		assert.equal(
			await readFile(join(root, ".flow/project.json"), "utf8"),
			before,
		);
	}
	const input = await proposal(root, "infra-change", [architecture, domain]);
	changeCommand(root, "--change", "infra-change", "--plan", input);
	changeCommand(
		root,
		"--change",
		"infra-change",
		"--set",
		"approved",
		"--approval",
		"Approve configuration revision",
	);
	changeCommand(root, "--change", "infra-change", "--set", "implementing");
	assert.equal(routeProject(root).skill, "to-architecture-surface");
	finishStep(root, architecture);
	finishStep(root, domain);
	changeCommand(root, "--change", "infra-change", "--set", "in-review");
	changeCommand(
		root,
		"--change",
		"infra-change",
		"--set",
		"complete",
		"--approval",
		"Accept review",
	);
	changeCommand(
		root,
		"--app",
		"api",
		"--phase",
		"api-surface",
		"--set",
		"in-progress",
		"--reopen",
	);
	const updated = JSON.parse(
		await readFile(join(root, ".flow/project.json"), "utf8"),
	);
	assert.deepEqual(updated.progress, {
		"domain-surface": "pending",
		"architecture-surface": "pending",
	});
});

test("legacy domain work blocks before delegation and writes without architecture", async (t) => {
	const root = await synthesize(t, {
		applications: [application("api", "api", { "api-surface": "complete" })],
		projectFields: { progress: { "domain-surface": "pending" } },
	});
	const before = await readFile(join(root, ".flow/project.json"), "utf8");
	const decision = routeProject(root);
	assert.equal(decision.decision, "blocked");
	assert.equal(decision.reason, "architecture-required");
	assert.match(decision.detail, /project-owned/);
	assert.throws(
		() => finishStep(root, { phase: "domain-surface" }),
		/Complete architecture/,
	);
	assert.equal(
		await readFile(join(root, ".flow/project.json"), "utf8"),
		before,
	);

	const input = await proposal(root, "legacy", [{ phase: "domain-surface" }]);
	const project = JSON.parse(before);
	project.progress["domain-surface"] = "complete";
	await writeFile(join(root, ".flow/project.json"), JSON.stringify(project));
	changeCommand(root, "--change", "legacy", "--plan", input);
	changeCommand(
		root,
		"--change",
		"legacy",
		"--set",
		"approved",
		"--approval",
		"Approved",
	);
	changeCommand(root, "--change", "legacy", "--set", "implementing");
	assert.equal(routeProject(root).reason, "architecture-required");
});

test("closed history survives new architecture rules and removed historical applications", async (t) => {
	const historical = {
		id: "old-feature",
		status: "complete",
		steps: [
			{ application: "former-api", phase: "api-surface" },
			{ phase: "domain-surface" },
		],
		approval: "Approved old scope",
		digest: "a".repeat(64),
		acceptance: "Accepted",
	};
	const root = await synthesize(t, {
		applications: [application("api", "api", { "api-surface": "complete" })],
		projectFields: {
			progress: {
				"architecture-surface": "pending",
				"domain-surface": "pending",
			},
			changes: [historical],
		},
	});
	assert.equal(routeProject(root).skill, "to-architecture-surface");
	finishStep(root, { phase: "architecture-surface" });
	finishStep(root, { phase: "domain-surface" });
	assert.deepEqual(changeCommand(root).changes, [historical]);
	const project = JSON.parse(
		await readFile(join(root, ".flow/project.json"), "utf8"),
	);
	project.changes[0].steps.push(project.changes[0].steps[0]);
	await writeFile(join(root, ".flow/project.json"), JSON.stringify(project));
	assert.equal(routeProject(root).decision, "blocked");
});

test("replanning only remaining work preserves completed phases and enforces downstream coverage", async (t) => {
	const root = await completedProject(t);
	const input = await proposal(root, "feature");
	changeCommand(root, "--change", "feature", "--plan", input);
	changeCommand(
		root,
		"--change",
		"feature",
		"--set",
		"approved",
		"--approval",
		"Approved",
	);
	changeCommand(root, "--change", "feature", "--set", "implementing");
	finishStep(root, evolutionPlan[0]);
	changeCommand(root, "--change", "feature", "--set", "proposed");
	const remaining = await proposal(root, "feature", evolutionPlan.slice(1));
	changeCommand(root, "--change", "feature", "--plan", remaining);
	changeCommand(
		root,
		"--change",
		"feature",
		"--set",
		"approved",
		"--approval",
		"Approve remaining work",
	);
	const result = changeCommand(
		root,
		"--change",
		"feature",
		"--set",
		"implementing",
	);
	assert.equal(
		result.applications.find((app) => app.name === "api").progress[
			"api-surface"
		],
		"complete",
	);
	assert.equal(routeProject(root).skill, "to-web-surface");
});
