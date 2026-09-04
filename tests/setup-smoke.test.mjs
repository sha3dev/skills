import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const setup = join(
	repositoryRoot,
	"skills/workflows/setup/scripts/initialize-repository.mjs",
);
const initializeWeb = join(
	repositoryRoot,
	"skills/workflows/to-web-surface/scripts/initialize-web-application.mjs",
);
const initializeApi = join(
	repositoryRoot,
	"skills/workflows/to-api-surface/scripts/initialize-api-application.mjs",
);
const route = join(repositoryRoot, "skills/workflows/flow/scripts/route.mjs");

function run(command, args, cwd = repositoryRoot) {
	const environment = { ...process.env };
	delete environment.NODE_TEST_CONTEXT;
	execFileSync(command, args, { cwd, env: environment, stdio: "inherit" });
}

function setProgress(root, application, phase, status, reopen = false) {
	run(process.execPath, [
		join(root, ".flow/tools/project-progress.mjs"),
		"--root",
		root,
		"--app",
		application,
		"--phase",
		phase,
		"--set",
		status,
		...(reopen ? ["--reopen"] : []),
	]);
}

function routeProject(root) {
	return JSON.parse(
		execFileSync(process.execPath, [route, "--root", root], {
			encoding: "utf8",
		}),
	);
}

test("setup produces valid web and API surfaces in dependency order", async () => {
	const temporaryRoot = await mkdtemp(join(tmpdir(), "sha3dev-skills-"));
	const targetRoot = join(temporaryRoot, "repository");
	const inputPath = join(temporaryRoot, "input.json");

	try {
		run("git", ["init", "--quiet", targetRoot], temporaryRoot);
		await writeFile(
			inputPath,
			JSON.stringify({
				title: "Example Project",
				definition: "A minimal setup smoke test.",
				terms: [],
				applications: [
					{
						name: "Viewer Web",
						responsibility: "Provide the viewer interface.",
						type: "web",
					},
					{
						name: "Viewer API",
						responsibility: "Provide viewer data over HTTP.",
						type: "api",
					},
				],
				relationships: [
					{
						from: "Viewer Web",
						to: "Viewer API",
						description: "Load viewer data over HTTP.",
					},
				],
			}),
		);

		run(process.execPath, [
			setup,
			"--root",
			targetRoot,
			"--input",
			inputPath,
			"--write",
		]);
		run("npm", ["install", "--no-audit", "--no-fund"], targetRoot);
		run("npm", ["run", "check"], targetRoot);
		const initialProject = JSON.parse(
			await readFile(join(targetRoot, ".flow/project.json"), "utf8"),
		);
		assert.deepEqual(initialProject.applications[0].progress, {
			"web-surface": "pending",
			"api-connection": "pending",
		});
		assert.deepEqual(initialProject.applications[1].progress, {
			"api-surface": "pending",
		});
		const fixtureDirectory = join(targetRoot, ".flow/fixtures");
		const usersFixture = join(fixtureDirectory, "users.json");
		await mkdir(fixtureDirectory);
		await writeFile(
			usersFixture,
			`${JSON.stringify([{ id: "user-ana", name: "Ana García" }], null, "\t")}\n`,
		);
		run("npm", ["run", "check:fixtures"], targetRoot);
		await writeFile(
			usersFixture,
			`${JSON.stringify([{ id: "user-ana" }, { id: "user-ana" }], null, "\t")}\n`,
		);
		assert.throws(() =>
			execFileSync("npm", ["run", "check:fixtures"], {
				cwd: targetRoot,
				stdio: "pipe",
			}),
		);
		await writeFile(
			usersFixture,
			`${JSON.stringify([{ id: "user-ana", name: "Ana García" }], null, "\t")}\n`,
		);
		const decision = routeProject(targetRoot);
		assert.equal(decision.decision, "run");
		assert.equal(decision.skill, "to-web-surface");
		setProgress(targetRoot, "Viewer Web", "web-surface", "in-progress");
		const project = JSON.parse(
			await readFile(join(targetRoot, ".flow/project.json"), "utf8"),
		);
		assert.equal(
			project.applications[0].progress["web-surface"],
			"in-progress",
		);
		run(process.execPath, [
			initializeWeb,
			"--root",
			targetRoot,
			"--app",
			"Viewer Web",
		]);
		await writeFile(
			join(targetRoot, "apps/viewer-web/src/user-repository.ts"),
			`import users from "../../../.flow/fixtures/users.json";

export type User = {
	id: string;
	name: string;
};

export function listUsers(): User[] {
	return users;
}
`,
		);
		await writeFile(
			join(targetRoot, "apps/viewer-web/src/App.tsx"),
			`import { listUsers } from "./user-repository";

export function App() {
	return (
		<main>
			<h1>{listUsers()[0]?.name}</h1>
		</main>
	);
}
`,
		);
		run("npm", ["install", "--no-audit", "--no-fund"], targetRoot);
		run("npm", ["run", "check"], targetRoot);
		run("npm", ["run", "build"], targetRoot);
		setProgress(targetRoot, "Viewer Web", "web-surface", "complete");
		const apiDecision = routeProject(targetRoot);
		assert.equal(apiDecision.decision, "run");
		assert.equal(apiDecision.skill, "to-api-surface");
		assert.equal(apiDecision.application, "Viewer API");
		setProgress(targetRoot, "Viewer API", "api-surface", "in-progress");
		run(process.execPath, [
			initializeApi,
			"--root",
			targetRoot,
			"--app",
			"Viewer API",
		]);
		run("npm", ["install", "--no-audit", "--no-fund"], targetRoot);
		run("npm", ["run", "test", "--workspace", "@apps/viewer-api"], targetRoot);
		run("npm", ["run", "check"], targetRoot);
		setProgress(targetRoot, "Viewer API", "api-surface", "complete");
		const connectionDecision = routeProject(targetRoot);
		assert.equal(connectionDecision.decision, "run");
		assert.equal(connectionDecision.skill, "connect-to-api");
		assert.equal(connectionDecision.application, "Viewer Web");
		setProgress(targetRoot, "Viewer Web", "api-connection", "in-progress");
		setProgress(targetRoot, "Viewer Web", "api-connection", "complete");
		const doneDecision = routeProject(targetRoot);
		assert.equal(doneDecision.decision, "done");

		setProgress(targetRoot, "Viewer Web", "web-surface", "in-progress", true);
		let reopenedProject = JSON.parse(
			await readFile(join(targetRoot, ".flow/project.json"), "utf8"),
		);
		assert.equal(
			reopenedProject.applications[0].progress["api-connection"],
			"pending",
		);
		assert.equal(routeProject(targetRoot).skill, "to-web-surface");
		setProgress(targetRoot, "Viewer Web", "web-surface", "complete");
		setProgress(targetRoot, "Viewer Web", "api-connection", "in-progress");
		setProgress(targetRoot, "Viewer Web", "api-connection", "complete");

		setProgress(targetRoot, "Viewer API", "api-surface", "in-progress", true);
		reopenedProject = JSON.parse(
			await readFile(join(targetRoot, ".flow/project.json"), "utf8"),
		);
		assert.equal(
			reopenedProject.applications[0].progress["api-connection"],
			"pending",
		);
		const reopenedDecision = routeProject(targetRoot);
		assert.equal(reopenedDecision.decision, "run");
		assert.equal(reopenedDecision.skill, "to-api-surface");
	} finally {
		await rm(temporaryRoot, { recursive: true, force: true });
	}
});

test("setup derives connection phases and unique application ports", async () => {
	const temporaryRoot = await mkdtemp(join(tmpdir(), "sha3dev-skills-"));
	const targetRoot = join(temporaryRoot, "repository");
	const inputPath = join(temporaryRoot, "input.json");

	try {
		run("git", ["init", "--quiet", targetRoot], temporaryRoot);
		await writeFile(
			inputPath,
			JSON.stringify({
				title: "Multiple Applications",
				definition: "Exercise derived workflow state and ports.",
				terms: [],
				applications: [
					{
						name: "Dashboard Web",
						responsibility: "Show combined data.",
						type: "web",
					},
					{
						name: "Static Web",
						responsibility: "Show static content.",
						type: "web",
					},
					{
						name: "Accounts API",
						responsibility: "Serve account data.",
						type: "api",
					},
					{
						name: "Content API",
						responsibility: "Serve content data.",
						type: "api",
					},
				],
				relationships: [
					{
						from: "Dashboard Web",
						to: "Accounts API",
						description: "Load account data over HTTP.",
					},
					{
						from: "Dashboard Web",
						to: "Content API",
						description: "Load content data over HTTP.",
					},
				],
			}),
		);

		run(process.execPath, [
			setup,
			"--root",
			targetRoot,
			"--input",
			inputPath,
			"--write",
		]);
		const project = JSON.parse(
			await readFile(join(targetRoot, ".flow/project.json"), "utf8"),
		);
		assert.deepEqual(project.applications[0].progress, {
			"web-surface": "pending",
			"api-connection": "pending",
		});
		assert.deepEqual(project.applications[1].progress, {
			"web-surface": "pending",
		});

		const initializations = [
			[initializeWeb, "Dashboard Web"],
			[initializeWeb, "Static Web"],
			[initializeApi, "Accounts API"],
			[initializeApi, "Content API"],
		].map(([initializer, application]) =>
			JSON.parse(
				execFileSync(
					process.execPath,
					[initializer, "--root", targetRoot, "--app", application],
					{ encoding: "utf8" },
				),
			),
		);
		assert.deepEqual(
			initializations.map((initialization) => initialization.url),
			[
				"http://localhost:4300/",
				"http://localhost:4301/",
				"http://localhost:4400/",
				"http://localhost:4401/",
			],
		);
		await writeFile(
			join(targetRoot, "apps/dashboard-web/.env.example"),
			"VITE_ACCOUNTS_API_BASE_URL=http://localhost:4400/\n",
		);
		const gitStatus = execFileSync(
			"git",
			["status", "--short", "--untracked-files=all"],
			{
				cwd: targetRoot,
				encoding: "utf8",
			},
		);
		assert.match(gitStatus, /apps\/dashboard-web\/\.env\.example/);

		for (const [application, phase] of [
			["Dashboard Web", "web-surface"],
			["Static Web", "web-surface"],
			["Accounts API", "api-surface"],
		]) {
			setProgress(targetRoot, application, phase, "in-progress");
			setProgress(targetRoot, application, phase, "complete");
		}
		const waitingForSecondApi = routeProject(targetRoot);
		assert.equal(waitingForSecondApi.skill, "to-api-surface");
		assert.equal(waitingForSecondApi.application, "Content API");

		for (const status of ["in-progress", "complete"]) {
			setProgress(targetRoot, "Content API", "api-surface", status);
		}
		const allApisComplete = routeProject(targetRoot);
		assert.equal(allApisComplete.skill, "connect-to-api");
		assert.equal(allApisComplete.application, "Dashboard Web");
	} finally {
		await rm(temporaryRoot, { recursive: true, force: true });
	}
});
