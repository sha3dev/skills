import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
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
	{ applications, relationships = [], repository = true, stateTool = true },
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
		JSON.stringify({ applications, relationships }),
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
