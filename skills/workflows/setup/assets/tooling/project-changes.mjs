import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const statuses = [
	"proposed",
	"approved",
	"implementing",
	"in-review",
	"complete",
];
const assert = (condition, message) => {
	if (!condition) throw new Error(message);
};
export const activeChange = (project) =>
	project.changes?.find((change) => change.status !== "complete");
export const stepKey = (step) =>
	JSON.stringify([step.application ?? null, step.phase]);
export function stepProgress(project, step) {
	const progress = step.application
		? project.applications.find((app) => app.name === step.application)
				?.progress
		: project.progress;
	assert(
		progress && Object.hasOwn(progress, step.phase),
		"Change step references an unknown application or phase",
	);
	return progress;
}
export function nextStep(project, change) {
	return change.steps.find(
		(step) => stepProgress(project, step)[step.phase] !== "complete",
	);
}
function allComplete(project) {
	return [
		...project.applications.map((app) => app.progress),
		project.progress ?? {},
	].every((progress) =>
		Object.values(progress).every((status) => status === "complete"),
	);
}
function validateSteps(project, steps, historical = false) {
	assert(
		Array.isArray(steps) && steps.length > 0,
		"Change plan needs ordered steps",
	);
	const keys = new Set();
	for (const step of steps) {
		assert(
			step &&
				typeof step === "object" &&
				!Array.isArray(step) &&
				Object.keys(step).every((key) =>
					["application", "phase"].includes(key),
				) &&
				typeof step.phase === "string" &&
				step.phase.length > 0 &&
				(step.application === undefined ||
					(typeof step.application === "string" &&
						step.application.length > 0)),
			"Invalid change step",
		);
		if (!historical) stepProgress(project, step);
		const key = stepKey(step);
		assert(!keys.has(key), "Duplicate change step");
		keys.add(key);
	}
	// Closed records describe the project at acceptance, not today's topology.
	if (historical) return;
	// A plan must cover every phase it invalidates, with integration after its inputs.
	const indexOf = (application, phase) =>
		steps.findIndex(
			(step) => stepKey(step) === stepKey({ application, phase }),
		);
	for (const app of project.applications) {
		const surface = indexOf(app.name, `${app.type}-surface`);
		if (surface < 0) continue;
		const consumers =
			app.type === "web"
				? [app]
				: app.type === "api"
					? project.relationships
							.filter((rel) => rel.to === app.name)
							.map((rel) =>
								project.applications.find((entry) => entry.name === rel.from),
							)
					: [];
		for (const consumer of consumers) {
			if (consumer.progress["api-connection"] !== undefined)
				assert(
					indexOf(consumer.name, "api-connection") > surface,
					`Plan must include ${consumer.name} api-connection after changed surfaces`,
				);
		}
	}
	for (const [index, step] of steps.entries()) {
		if (step.phase !== "api-connection") continue;
		const inputs = [
			step.application,
			...project.relationships
				.filter((rel) => rel.from === step.application)
				.map((rel) => rel.to),
		];
		assert(
			!steps
				.slice(index + 1)
				.some(
					(later) =>
						inputs.includes(later.application) &&
						later.phase.endsWith("-surface"),
				),
			"Connection must follow its changed surfaces",
		);
	}
	if (
		steps.some(
			(step) => step.application || step.phase === "architecture-surface",
		) &&
		project.progress?.["domain-surface"] !== undefined
	)
		assert(
			indexOf(undefined, "domain-surface") === steps.length - 1,
			"Plan must end with domain-surface reconciliation",
		);
	if (project.progress?.["architecture-surface"] !== undefined) {
		const architecture = indexOf(undefined, "architecture-surface");
		const lastApp = steps.findLastIndex((step) => step.application);
		if (lastApp >= 0)
			assert(
				architecture > lastApp,
				"Plan must reconcile architecture-surface after application steps",
			);
		if (architecture >= 0)
			assert(
				indexOf(undefined, "domain-surface") > architecture,
				"Domain must follow architecture-surface",
			);
	}
}
export function validateChanges(project) {
	if (project.changes === undefined) return;
	assert(Array.isArray(project.changes), "project.changes must be an array");
	const ids = new Set();
	let active = 0;
	for (const change of project.changes) {
		assert(
			change &&
				typeof change.id === "string" &&
				/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(change.id) &&
				!ids.has(change.id),
			"Invalid or duplicate change id",
		);
		ids.add(change.id);
		assert(statuses.includes(change.status), "Invalid change status");
		validateSteps(project, change.steps, change.status === "complete");
		if (change.status !== "complete") active++;
		if (change.status !== "proposed")
			assert(
				typeof change.approval === "string" &&
					change.approval.trim() &&
					/^[a-f0-9]{64}$/.test(change.digest),
				"Change has no approved proposal",
			);
		if (change.status === "complete")
			assert(
				typeof change.acceptance === "string" && change.acceptance.trim(),
				"Completed change has no integrated acceptance",
			);
	}
	assert(active <= 1, "Only one change may be active");
	const activeEntry = activeChange(project);
	if (activeEntry?.status === "in-review")
		assert(allComplete(project), "Review requires completed phases");
}
async function digest(root, change) {
	const document = await readFile(
		join(root, ".flow/changes", `${change.id}.md`),
		"utf8",
	);
	assert(document.trim(), "Change document must not be empty");
	return createHash("sha256")
		.update(document)
		.update(JSON.stringify(change.steps))
		.digest("hex");
}
export async function updateChange(
	project,
	root,
	{ id, plan, status, approval },
) {
	assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id), "Invalid change id");
	let change = project.changes?.find((entry) => entry.id === id);
	const active = activeChange(project);
	assert(!active || active.id === id, "Only one change may be active");
	assert(
		change?.status !== "complete",
		"Closed changes are immutable; create a new change",
	);
	if (!change) {
		assert(allComplete(project), "Finish initial work before opening a change");
		assert(
			plan && (!status || status === "proposed"),
			"New change requires a proposed plan",
		);
		change = { id, status: "proposed", steps: [] };
		(project.changes ??= []).push(change);
	}
	if (plan) {
		assert(
			change.status === "proposed",
			"Return the change to proposed before editing its plan",
		);
		change.steps = JSON.parse(await readFile(plan, "utf8"));
		validateSteps(project, change.steps);
		await digest(root, change);
	}
	if (!status || status === change.status) return;
	assert(statuses.includes(status), "Invalid change status");
	if (status === "proposed") {
		delete change.approval;
		delete change.digest;
	} else if (status === "approved" && change.status === "proposed") {
		assert(approval?.trim(), "Record explicit human approval with --approval");
		// Replanning cannot strand unfinished work from an earlier approved plan.
		for (const app of [
			...project.applications,
			{ progress: project.progress ?? {} },
		])
			for (const [phase, phaseStatus] of Object.entries(app.progress))
				if (phaseStatus !== "complete")
					assert(
						change.steps.some(
							(step) =>
								stepKey(step) === stepKey({ application: app.name, phase }),
						),
						"Plan omits unfinished work",
					);
		change.approval = approval.trim();
		change.digest = await digest(root, change);
	} else if (status === "implementing" && change.status === "approved") {
		assert(
			change.digest === (await digest(root, change)),
			"Proposal changed after approval; return to proposed",
		);
		for (const step of change.steps)
			stepProgress(project, step)[step.phase] = "pending";
	} else if (status === "in-review" && change.status === "implementing") {
		assert(allComplete(project), "Finish all phases before integrated review");
	} else if (status === "complete" && change.status === "in-review") {
		assert(allComplete(project), "Finish all phases before closing the change");
		assert(
			approval?.trim(),
			"Record explicit integrated acceptance with --approval",
		);
		change.acceptance = approval.trim();
	} else
		throw new Error(`Invalid change transition: ${change.status} -> ${status}`);
	change.status = status;
}
export function assertChangeStep(project, step) {
	const change = activeChange(project);
	if (!change) return;
	assert(
		change.status === "implementing",
		"Phase writes require an implementing change",
	);
	const next = nextStep(project, change);
	assert(
		next && stepKey(next) === stepKey(step),
		"Phase is not the next approved change step",
	);
}
