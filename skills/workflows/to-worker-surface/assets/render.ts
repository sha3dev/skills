import type {
	Configuration,
	Description,
	WorkerContract,
} from "./contract-types";

function escapeHtml(value: string | number | boolean): string {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function configurationId(name: string): string {
	return `config-${Buffer.from(name, "utf8").toString("hex")}`;
}

function displayDefault(setting: Configuration): string {
	if (setting.secret) return "Secret — value not shown";
	if (setting.default === null) return "No default";
	const value = setting.default === "" ? '""' : setting.default;
	return `${escapeHtml(value)}${setting.unit ? ` ${escapeHtml(setting.unit)}` : ""}`;
}

export function renderContract(contract: WorkerContract): string {
	for (const [name, setting] of Object.entries(contract.configuration)) {
		if (!name.trim()) {
			throw new Error(`Invalid configuration name: ${name}`);
		}
		if (setting.secret && setting.default !== null) {
			throw new Error(
				`Secret configuration must not contain a default: ${name}`,
			);
		}
		if (
			setting.default !== null &&
			(typeof setting.default !== setting.type ||
				(typeof setting.default === "number" &&
					!Number.isFinite(setting.default)))
		) {
			throw new Error(`Invalid configuration default: ${name}`);
		}
	}
	const describe = (parts: Description): string =>
		parts
			.map((part) => {
				if (typeof part === "string") return escapeHtml(part);
				const setting = Object.hasOwn(contract.configuration, part.config)
					? contract.configuration[part.config]
					: undefined;
				if (!setting)
					throw new Error(`Unknown configuration reference: ${part.config}`);
				return `<a class="parameter" href="#${configurationId(part.config)}"><code>${escapeHtml(part.config)}</code> <span>(${displayDefault(setting)})</span></a>`;
			})
			.join("");
	const processes = contract.processes
		.map(
			(process) => `<article><h3>${escapeHtml(process.name)}</h3>
<p class="trigger">${describe(process.trigger)}</p>
<p>${describe(process.description)}</p></article>`,
		)
		.join("\n");
	const configuration = Object.entries(contract.configuration)
		.map(
			([
				name,
				setting,
			]) => `<article id="${configurationId(name)}" tabindex="-1">
<h3><code>${escapeHtml(name)}</code></h3>
<p class="metadata">${escapeHtml(setting.type)} · ${setting.required ? "Required" : "Optional"}${setting.unit ? ` · Unit: ${escapeHtml(setting.unit)}` : ""}</p>
<p><strong>Default:</strong> ${displayDefault(setting)}</p>
<p>${escapeHtml(setting.effect)}</p>
${setting.constraints ? `<p><strong>Limits:</strong> ${escapeHtml(setting.constraints)}</p>` : ""}
${setting.source ? `<p><strong>Source:</strong> ${escapeHtml(setting.source)}</p>` : ""}
${setting.applies ? `<p><strong>Changes:</strong> ${escapeHtml(setting.applies)}</p>` : ""}
</article>`,
		)
		.join("\n");
	return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="data:,">
<title>${escapeHtml(contract.name)}</title><link rel="stylesheet" href="/reference.css"></head>
<body><main class="contract"><header class="cover"><div><p class="eyebrow">Worker contract</p>
<h1>${escapeHtml(contract.name)}</h1><p class="lede">${escapeHtml(contract.purpose)}</p></div></header>
<div class="document">
<section class="document-section" aria-labelledby="processes"><div class="section-heading"><h2 id="processes">Processes</h2></div>${processes || "<p>No processes specified yet.</p>"}</section>
<section class="document-section" aria-labelledby="configuration"><div class="section-heading"><h2 id="configuration">Configuration</h2></div>
${contract.configurationSource ? `<p><strong>Source:</strong> ${escapeHtml(contract.configurationSource)}</p>` : ""}
${contract.configurationApplies ? `<p><strong>Changes:</strong> ${escapeHtml(contract.configurationApplies)}</p>` : ""}
${configuration || "<p>No configuration parameters.</p>"}</section>
</div></main></body></html>`;
}
