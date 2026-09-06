import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../app";
import type { WorkerContract } from "../contract-types";
import { renderContract } from "../render";

const intervalName = "INTERVAL_SECONDS";
const tokenName = "API_TOKEN";

function example(): WorkerContract {
	return {
		name: "Order worker",
		purpose: "Process pending orders.",
		configurationSource: "Environment variables.",
		configurationApplies: "Restart to apply changes.",
		configuration: {
			INTERVAL_SECONDS: {
				type: "number",
				default: 60,
				unit: "seconds",
				required: false,
				effect: "Time between checks.",
			},
		},
		processes: [
			{
				name: "Pending orders",
				trigger: ["Every ", { config: "INTERVAL_SECONDS" }, "."],
				description: ["Process pending orders."],
			},
		],
	};
}

test("references and configuration entries share updated defaults", () => {
	const contract = example();
	const setting = contract.configuration[intervalName];
	assert.ok(setting);
	setting.default = 120;
	const html = renderContract(contract);
	const target = html.match(/href="#([^"]+)"/)?.[1];
	assert.ok(target);
	assert.ok(html.includes(`id="${target}"`));
	assert.equal(html.split("120 seconds").length - 1, 2);
	assert.doesNotMatch(html, /60 seconds/);
	setting.default = 0;
	assert.match(renderContract(contract), /0 seconds/);
});

test("unknown references and mismatched defaults fail visibly", () => {
	const contract = example();
	delete contract.configuration[intervalName];
	assert.throws(
		() => renderContract(contract),
		/Unknown configuration reference/,
	);
	contract.configuration[intervalName] = {
		type: "number",
		default: "60",
		required: false,
		effect: "Interval.",
	};
	assert.throws(
		() => renderContract(contract),
		/Invalid configuration default/,
	);
});

test("text is escaped and secret defaults cannot enter the page", () => {
	const contract = example();
	contract.purpose = '<script>alert("test")</script>';
	contract.configuration[tokenName] = {
		type: "string",
		default: null,
		secret: true,
		required: true,
		effect: "Authenticate requests.",
	};
	const html = renderContract(contract);
	assert.doesNotMatch(html, /<script>/);
	assert.match(html, /&lt;script&gt;/);
	assert.match(html, /Secret — value not shown/);
	contract.configuration[tokenName].default = "do-not-display";
	assert.throws(() => renderContract(contract), /Secret configuration/);
});

test("serves the contract and stylesheet without execution endpoints", async (context) => {
	const app = buildApp();
	context.after(() => app.close());
	const page = await app.inject("/");
	assert.equal(page.statusCode, 200);
	assert.match(page.headers["content-type"] ?? "", /text\/html/);
	assert.match(page.body, /Worker contract/);
	const styles = await app.inject("/reference.css");
	assert.equal(styles.statusCode, 200);
	assert.match(styles.headers["content-type"] ?? "", /text\/css/);
	const execution = await app.inject({ method: "POST", url: "/run" });
	assert.equal(execution.statusCode, 404);
});

test("preserves mixed-case and punctuation names with distinct safe anchors", () => {
	const contract = example();
	const names = [
		"pollIntervalMs",
		"poll.interval",
		"poll-interval",
		'mode"<tag>',
		"límite",
	];
	contract.configuration = Object.fromEntries(
		names.map((name) => [
			name,
			{
				type: "number",
				default: 1,
				required: false,
				effect: "Controls processing.",
			},
		]),
	);
	contract.processes = [
		{
			name: "Processing",
			trigger: ["On demand."],
			description: names.map((config) => ({ config })),
		},
	];
	const html = renderContract(contract);
	const targets = [...html.matchAll(/href="#([^"]+)"/g)].map(
		(match) => match[1],
	);
	assert.equal(new Set(targets).size, names.length);
	for (const target of targets) assert.ok(html.includes(`id="${target}"`));
	assert.match(html, /<code>pollIntervalMs<\/code>/);
	assert.match(html, /mode&quot;&lt;tag&gt;/);
	assert.match(html, /límite/);
	assert.doesNotMatch(html, /<tag>/);
});
