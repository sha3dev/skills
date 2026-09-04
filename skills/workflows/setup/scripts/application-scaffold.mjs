// Shared workspace initializer for the application workflows. `to-web-surface`
// and `to-api-surface` create the same workspace shape — validated phase,
// `apps/<slug>` layout, root-pinned dependencies, derived preview port,
// `already-initialized` short circuit and all-or-nothing write — and differ
// only in type, port range and file map. It lives in `setup` because that
// workflow owns the generated repository contract; sibling workflows import it
// through `../../setup/scripts/application-scaffold.mjs`, the installed-sibling
// convention `flow` already uses. These skills are always installed together.
import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, rmdir, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";

export function fail(message) {
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

// Directories every file in the map needs, parents before children.
function directoriesFor(paths) {
	const directories = new Set();
	for (const path of paths) {
		let directory = dirname(path);
		while (directory !== ".") {
			directories.add(directory);
			directory = dirname(directory);
		}
	}
	return [...directories].sort(
		(left, right) => left.split("/").length - right.split("/").length,
	);
}

// The port a previous run wrote. Recomputing it from the application index
// would report a stale URL whenever the project's application set changes.
async function establishedPort(applicationRoot, workspacePath, source) {
	const path = join(applicationRoot, source.path);
	let content;
	try {
		content = await readFile(path, "utf8");
	} catch {
		fail(`Cannot read the preview port from ${workspacePath}${source.path}`);
	}
	const port = Number(content.match(source.pattern)?.[1]);
	if (!Number.isInteger(port)) {
		fail(`Cannot read the preview port from ${workspacePath}${source.path}`);
	}
	return port;
}

/**
 * Initialize one application workspace from `--root` and `--app`, and write the
 * initializer result to stdout.
 *
 * @param {object} definition
 * @param {string} definition.type Application type this initializer accepts.
 * @param {string} definition.typeLabel Type as it reads in an error message.
 * @param {string} definition.phase Phase that must be open to initialize.
 * @param {number} definition.firstPreviewPort Port of the first application of this type.
 * @param {{path: string, pattern: RegExp}} definition.portSource Generated file
 *   holding the port, and the pattern capturing it, for later runs.
 * @param {(context: object) => Map<string, string>} definition.files Workspace
 *   files, keyed by application-relative path.
 */
export async function scaffoldApplication(definition) {
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
	if (application?.type !== definition.type) {
		fail(`${applicationName} is not ${definition.typeLabel}`);
	}
	if (
		!application.progress ||
		!["pending", "in-progress"].includes(application.progress[definition.phase])
	) {
		fail(
			`${application.name} ${definition.phase} is not open for initialization`,
		);
	}

	const applicationRoot = resolve(root, application.path);
	const repositoryPath = relative(root, applicationRoot).split(sep).join("/");
	if (!/^apps\/[^/]+$/.test(repositoryPath)) {
		fail(`Invalid application path: ${application.path}`);
	}
	const workspacePath = `${repositoryPath}/`;
	const packagePath = join(applicationRoot, "package.json");
	if (await exists(packagePath)) {
		const existingPackage = JSON.parse(await readFile(packagePath, "utf8"));
		const port = await establishedPort(
			applicationRoot,
			workspacePath,
			definition.portSource,
		);
		process.stdout.write(
			`${JSON.stringify({ status: "already-initialized", application: application.name, path: workspacePath, workspace: existingPackage.name, url: `http://localhost:${port}/` })}\n`,
		);
		return;
	}

	const project = JSON.parse(
		await readFile(join(root, ".flow/project.json"), "utf8"),
	);
	const applicationIndex = project.applications
		.filter((candidate) => candidate.type === definition.type)
		.findIndex((candidate) => candidate.name === application.name);
	if (applicationIndex < 0) {
		fail(`${application.name} is missing from the project`);
	}
	const previewPort = definition.firstPreviewPort + applicationIndex;
	const rootPackage = JSON.parse(
		await readFile(join(root, "package.json"), "utf8"),
	);
	const slug = basename(applicationRoot);
	const workspaceName = `@apps/${slug}`;
	const files = definition.files({
		application,
		dependency: (group, name) => dependency(rootPackage, group, name),
		previewPort,
		workspaceName,
	});

	const directories = directoriesFor(files.keys());
	for (const directory of directories) {
		if (await exists(join(applicationRoot, directory))) {
			fail(
				`Application source path already exists: ${workspacePath}${directory}/`,
			);
		}
	}
	for (const path of files.keys()) {
		if (await exists(join(applicationRoot, path))) {
			fail(`Application file already exists: ${workspacePath}${path}`);
		}
	}

	const createdFiles = [];
	const createdDirectories = [];
	const applicationRootExisted = await exists(applicationRoot);
	await mkdir(applicationRoot, { recursive: true });
	try {
		for (const directory of directories) {
			const target = join(applicationRoot, directory);
			await mkdir(target);
			createdDirectories.push(target);
		}
		for (const [path, content] of files) {
			const target = join(applicationRoot, path);
			await writeFile(target, content, { flag: "wx" });
			createdFiles.push(target);
		}
	} catch (error) {
		for (const path of createdFiles.reverse()) {
			await rm(path, { force: true });
		}
		for (const path of createdDirectories.reverse()) {
			await rmdir(path).catch(() => {});
		}
		if (!applicationRootExisted) await rmdir(applicationRoot).catch(() => {});
		throw error;
	}

	process.stdout.write(
		`${JSON.stringify({ status: "initialized", application: application.name, path: workspacePath, workspace: workspaceName, url: `http://localhost:${previewPort}/` })}\n`,
	);
}
