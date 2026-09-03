#!/usr/bin/env node

import { constants } from "node:fs";
import { access, readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

async function exists(path) {
	try {
		await access(path, constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

function option(args, name, fallback) {
	const index = args.indexOf(name);
	if (index === -1) return fallback;
	if (!args[index + 1]) fail(`Missing ${name}`);
	return args[index + 1];
}

function recordId(value, path) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		fail(`${path} must be an object`);
	}
	if (typeof value.id !== "string" || !value.id.trim()) {
		fail(`${path}.id must be a non-empty string`);
	}
	return value.id;
}

try {
	const root = resolve(option(process.argv.slice(2), "--root", "."));
	const directory = join(root, ".flow/fixtures");
	if (!(await exists(directory))) {
		process.stdout.write('{"status":"valid","collections":0,"records":0}\n');
		process.exit(0);
	}

	const entries = await readdir(directory, { withFileTypes: true });
	const unsupported = entries.filter(
		(entry) =>
			!entry.isFile() ||
			!/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(entry.name),
	);
	if (unsupported.length > 0) {
		fail(
			`.flow/fixtures accepts only kebab-case JSON collection files: ${unsupported.map((entry) => entry.name).join(", ")}`,
		);
	}

	let records = 0;
	const files = entries.map((entry) => entry.name).sort();
	for (const file of files) {
		let collection;
		try {
			collection = JSON.parse(await readFile(join(directory, file), "utf8"));
		} catch (error) {
			fail(`.flow/fixtures/${file} is invalid JSON: ${error.message}`);
		}
		if (!Array.isArray(collection)) {
			fail(`.flow/fixtures/${file} must contain an array`);
		}
		const identifiers = new Set();
		for (const [index, value] of collection.entries()) {
			const id = recordId(value, `.flow/fixtures/${file}[${index}]`);
			if (identifiers.has(id)) {
				fail(`.flow/fixtures/${file} contains duplicate id: ${id}`);
			}
			identifiers.add(id);
			records += 1;
		}
	}

	process.stdout.write(
		`${JSON.stringify({ status: "valid", collections: files.length, records })}\n`,
	);
} catch (error) {
	fail(error.message);
}
