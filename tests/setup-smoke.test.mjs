import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const setup = join(
	repositoryRoot,
	"skills/workflows/setup/scripts/initialize-repository.mjs",
);
const initializeWeb = join(
	repositoryRoot,
	"skills/workflows/to-web-surface/scripts/initialize-web-application.mjs",
);
const route = join(
	repositoryRoot,
	"skills/workflows/flow/scripts/route.mjs",
);

function run(command, args, cwd = repositoryRoot) {
	execFileSync(command, args, { cwd, stdio: "inherit" });
}

test("setup produces a valid buildable web repository", async () => {
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
				],
				relationships: [],
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
		const decision = JSON.parse(
			execFileSync(process.execPath, [route, "--root", targetRoot], {
				encoding: "utf8",
			}),
		);
		assert.equal(decision.decision, "run");
		assert.equal(decision.skill, "to-web-surface");
		run(process.execPath, [
			join(targetRoot, ".flow/tools/project-progress.mjs"),
			"--root",
			targetRoot,
			"--app",
			"Viewer Web",
			"--phase",
			"web-surface",
			"--set",
			"in-progress",
		]);
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
	} finally {
		await rm(temporaryRoot, { recursive: true, force: true });
	}
});
