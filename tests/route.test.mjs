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
