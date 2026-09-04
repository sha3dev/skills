const METHODS = [
	"get",
	"post",
	"put",
	"patch",
	"delete",
	"options",
	"head",
	"trace",
];
const MUTATIONS = new Set(["post", "put", "patch", "delete"]);
const root = document.querySelector("#reference");
let contract;

function esc(value) {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

function resourceName(path, operation) {
	if (operation.tags?.[0]) return operation.tags[0];
	const segment = path.split("/").find(Boolean) ?? "General";
	return segment
		.replaceAll(/[-_]/g, " ")
		.replace(/^./, (letter) => letter.toUpperCase());
}

function operationsOf(document) {
	const operations = [];
	for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
		for (const method of METHODS) {
			if (!pathItem[method]) continue;
			operations.push({
				...pathItem[method],
				method,
				path,
				key: method + " " + path,
				resource: resourceName(path, pathItem[method]),
				parameters: [
					...(pathItem.parameters ?? []),
					...(pathItem[method].parameters ?? []),
				],
			});
		}
	}
	return operations;
}

function anchor(operation) {
	return operation.key
		.toLowerCase()
		.replaceAll(/[^a-z0-9]+/g, "-")
		.replaceAll(/(^-|-$)/g, "");
}

function label(schema) {
	if (!schema) return "none";
	if (schema.$ref) return schema.$ref.split("/").at(-1);
	if (schema.type === "array") return label(schema.items) + "[]";
	if (schema.type) return schema.type;
	for (const key of ["oneOf", "anyOf", "allOf"]) {
		if (schema[key])
			return schema[key].map(label).join(key === "allOf" ? " + " : " | ");
	}
	return "object";
}

function compact(value) {
	return typeof value === "string" ? value : JSON.stringify(value);
}

function rules(schema = {}) {
	const values = [];
	if (schema.description) values.push(schema.description);
	if (schema.format) values.push("format: " + schema.format);
	if (schema.const !== undefined)
		values.push("fixed: " + compact(schema.const));
	if (schema.enum)
		values.push("one of: " + schema.enum.map(compact).join(" · "));
	for (const [key, title] of [
		["default", "default"],
		["example", "example"],
		["minimum", "min"],
		["maximum", "max"],
		["minLength", "min length"],
		["maxLength", "max length"],
		["minItems", "min items"],
		["maxItems", "max items"],
		["pattern", "pattern"],
	])
		if (schema[key] !== undefined)
			values.push(title + ": " + compact(schema[key]));
	if (schema.readOnly) values.push("read only");
	if (schema.writeOnly) values.push("write only");
	if (schema.deprecated) values.push("deprecated");
	if (schema.nullable) values.push("nullable");
	return values;
}

function rowsFor(schema, field = "value", required = false, depth = 0) {
	if (!schema) return [];
	const result = [];
	const properties = schema.properties ?? {};
	const rootObject =
		depth === 0 &&
		field === "value" &&
		(schema.type === "object" || Object.keys(properties).length > 0);
	if (!rootObject)
		result.push({
			field,
			type: label(schema),
			required,
			rules: rules(schema),
			depth,
		});
	const requiredNames = new Set(schema.required ?? []);
	for (const [name, child] of Object.entries(properties)) {
		result.push(
			...rowsFor(
				child,
				rootObject ? name : field + "." + name,
				requiredNames.has(name),
				depth,
			),
		);
	}
	if (schema.type === "array" && schema.items?.properties) {
		const requiredItems = new Set(schema.items.required ?? []);
		for (const [name, child] of Object.entries(schema.items.properties)) {
			result.push(
				...rowsFor(
					child,
					field + "[]." + name,
					requiredItems.has(name),
					depth + 1,
				),
			);
		}
	}
	for (const key of ["oneOf", "anyOf", "allOf"]) {
		for (const [index, variant] of (schema[key] ?? []).entries()) {
			result.push(
				...rowsFor(
					variant,
					field + " · " + key + " " + (index + 1),
					required,
					depth + 1,
				),
			);
		}
	}
	if (
		schema.additionalProperties &&
		typeof schema.additionalProperties === "object"
	) {
		result.push(
			...rowsFor(schema.additionalProperties, field + ".*", false, depth + 1),
		);
	}
	return result;
}

function schemaTable(schema) {
	const rows = rowsFor(schema);
	if (!rows.length) return '<p class="no-body">No body</p>';
	return (
		'<div class="table-scroll"><table class="schema-table"><thead><tr><th>Field</th><th>Type</th><th>Req.</th><th>Rules</th></tr></thead><tbody>' +
		rows
			.map(
				(row) =>
					'<tr><td><code class="field" style="--depth:' +
					row.depth +
					'">' +
					esc(row.field) +
					'</code></td><td><span class="type">' +
					esc(row.type) +
					"</span></td><td>" +
					(row.required ? '<span class="required">yes</span>' : "—") +
					'</td><td class="rules">' +
					(row.rules.length ? row.rules.map(esc).join("<br>") : "—") +
					"</td></tr>",
			)
			.join("") +
		"</tbody></table></div>"
	);
}

function contentBlock(content) {
	if (!content || Object.keys(content).length === 0)
		return '<p class="no-body">No body</p>';
	const hasBodyShape = Object.values(content).some(({ schema }) =>
		["$ref", "type", "properties", "oneOf", "anyOf", "allOf", "items"].some(
			(key) => schema?.[key] !== undefined,
		),
	);
	if (!hasBodyShape) return '<p class="no-body">No body</p>';
	return Object.entries(content)
		.map(
			([mediaType, value]) =>
				'<section class="media-schema"><div class="media-bar"><code>' +
				esc(mediaType) +
				"</code><span>" +
				esc(label(value.schema)) +
				"</span></div>" +
				schemaTable(value.schema) +
				(value.example === undefined
					? ""
					: '<div class="example"><span>Example</span><code>' +
						esc(compact(value.example)) +
						"</code></div>") +
				"</section>",
		)
		.join("");
}

function parametersTable(operation) {
	if (!operation.parameters.length) return "";
	const rows = operation.parameters
		.map((parameter) => {
			const notes = rules(parameter.schema);
			if (parameter.description) notes.unshift(parameter.description);
			if (parameter.example !== undefined)
				notes.push("example: " + compact(parameter.example));
			return (
				"<tr><td><code>" +
				esc(parameter.name) +
				"</code></td><td>" +
				esc(parameter.in) +
				"</td><td>" +
				(parameter.required ? '<span class="required">yes</span>' : "—") +
				'</td><td><span class="type">' +
				esc(label(parameter.schema)) +
				'</span></td><td class="rules">' +
				(notes.length ? notes.map(esc).join("<br>") : "—") +
				"</td></tr>"
			);
		})
		.join("");
	return (
		'<div class="table-scroll"><table class="parameters-table"><thead><tr><th>Name</th><th>In</th><th>Req.</th><th>Type</th><th>Rules</th></tr></thead><tbody>' +
		rows +
		"</tbody></table></div>"
	);
}

function securityLabel(security) {
	if (security === undefined || security.length === 0) return "Public";
	return security
		.map((requirement) =>
			Object.entries(requirement)
				.map(
					([scheme, scopes]) =>
						scheme + (scopes.length ? " · " + scopes.join(", ") : ""),
				)
				.join(" + "),
		)
		.join(" or ");
}

function responses(operation) {
	return Object.entries(operation.responses ?? {})
		.map(
			([status, response]) =>
				'<article class="response response-' +
				(String(status).startsWith("2") ? "success" : "error") +
				'"><header><span class="status">' +
				esc(status) +
				"</span><p>" +
				esc(response.description ?? "Undocumented outcome") +
				"</p></header>" +
				contentBlock(response.content) +
				"</article>",
		)
		.join("");
}

function block(title, content) {
	return content
		? '<section class="contract-block"><h5>' +
				esc(title) +
				"</h5>" +
				content +
				"</section>"
		: "";
}

function operationCard(operation) {
	const input =
		block("Parameters", parametersTable(operation)) +
		(operation.requestBody
			? block(
					"Body" + (operation.requestBody.required ? " · required" : ""),
					contentBlock(operation.requestBody.content),
				)
			: "");
	const meta = [
		operation.operationId ? "ID · " + operation.operationId : "",
		"Auth · " + securityLabel(operation.security ?? contract.security),
		operation.deprecated ? "Deprecated" : "",
	]
		.filter(Boolean)
		.map((item) => "<span>" + esc(item) + "</span>")
		.join("");
	return (
		'<article class="operation-sheet" id="' +
		anchor(operation) +
		'"><header class="operation-heading"><div class="route"><span class="method method-' +
		esc(operation.method) +
		'">' +
		esc(operation.method.toUpperCase()) +
		"</span><code>" +
		esc(operation.path) +
		"</code></div><h3>" +
		esc(operation.summary || operation.operationId || "Operation") +
		'</h3></header><div class="operation-intro"><p>' +
		esc(operation.description || "No additional purpose recorded.") +
		'</p><div class="operation-meta">' +
		meta +
		'</div></div><div class="operation-body"><div class="input-column"><h4>Input</h4>' +
		(input || '<p class="empty-column">No request input</p>') +
		'</div><div class="output-column"><h4>Outcomes</h4>' +
		responses(operation) +
		"</div></div></article>"
	);
}

function overview(operations) {
	const paths = [...new Set(operations.map((operation) => operation.path))];
	return (
		'<div class="table-scroll"><table class="overview-table"><thead><tr><th>Path</th><th>Methods</th><th>Resource</th></tr></thead><tbody>' +
		paths
			.map((path) => {
				const matches = operations.filter(
					(operation) => operation.path === path,
				);
				return (
					'<tr><td class="path">' +
					esc(path) +
					'</td><td><div class="capabilities">' +
					matches
						.map(
							(operation) =>
								'<span class="method method-' +
								operation.method +
								'">' +
								operation.method.toUpperCase() +
								"</span>",
						)
						.join("") +
					"</div></td><td>" +
					esc(
						[...new Set(matches.map((operation) => operation.resource))].join(
							", ",
						),
					) +
					"</td></tr>"
				);
			})
			.join("") +
		"</tbody></table></div>"
	);
}

function contents(groups) {
	return (
		'<div class="table-scroll"><table class="contents-table"><thead><tr><th>Resource</th><th>Method</th><th>Path</th><th>Operation</th></tr></thead><tbody>' +
		[...groups.entries()]
			.map(([resource, operations]) =>
				operations
					.map(
						(operation, index) =>
							"<tr>" +
							(index === 0
								? '<th class="resource-cell" scope="rowgroup" rowspan="' +
									operations.length +
									'">' +
									esc(resource) +
									"</th>"
								: "") +
							'<td><span class="method method-' +
							operation.method +
							'">' +
							operation.method.toUpperCase() +
							'</span></td><td><a href="#' +
							anchor(operation) +
							'"><code>' +
							esc(operation.path) +
							'</code></a></td><td><a href="#' +
							anchor(operation) +
							'">' +
							esc(operation.summary || operation.operationId || "Operation") +
							"</a></td></tr>",
					)
					.join(""),
			)
			.join("") +
		"</tbody></table></div>"
	);
}

function render() {
	const operations = operationsOf(contract);
	const groups = Map.groupBy(operations, (operation) => operation.resource);
	const mutations = operations.filter((operation) =>
		MUTATIONS.has(operation.method),
	).length;
	root.className = "contract";
	root.innerHTML =
		'<header class="cover"><div class="cover-copy"><p class="eyebrow">API contract <span>v' +
		esc(contract.info?.version || "unversioned") +
		"</span></p><h1>" +
		esc(contract.info?.title || "API review") +
		'</h1><p class="lede">' +
		esc(
			contract.info?.description || "The complete API shape in one document.",
		) +
		'</p></div><div class="cover-tools"><div class="summary"><span><strong>' +
		groups.size +
		"</strong> resources</span><span><strong>" +
		operations.length +
		"</strong> operations</span><span><strong>" +
		mutations +
		'</strong> mutations</span></div><button id="print-contract" class="print no-print" type="button">Print / PDF</button></div></header>' +
		'<main class="document"><section class="document-section overview"><div class="section-heading"><h2>Endpoints</h2></div>' +
		overview(operations) +
		'</section><nav class="document-section index" aria-label="Contract contents"><div class="section-heading"><h2>Operations</h2></div>' +
		contents(groups) +
		"</nav>" +
		[...groups.entries()]
			.map(
				([resource, resourceOperations]) =>
					'<section class="resource-chapter"><header class="resource-heading"><h2>' +
					esc(resource) +
					"</h2><span>" +
					resourceOperations.length +
					(resourceOperations.length === 1 ? " operation" : " operations") +
					"</span></header>" +
					resourceOperations.map(operationCard).join("") +
					"</section>",
			)
			.join("") +
		"</main>";
	document
		.querySelector("#print-contract")
		.addEventListener("click", () => window.print());
}

try {
	const response = await fetch("/openapi.json");
	if (!response.ok) throw new Error("OpenAPI returned " + response.status);
	contract = await response.json();
	render();
} catch (error) {
	root.className = "failure";
	root.textContent = "The API contract could not be loaded: " + error.message;
}
