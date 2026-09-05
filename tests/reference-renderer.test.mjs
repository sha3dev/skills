import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rendererPath = fileURLToPath(
	new URL(
		"../skills/workflows/to-api-surface/assets/reference/reference.js",
		import.meta.url,
	),
);

test("API reference expands local schemas and exposes reference limitations", async () => {
	const root = { className: "", innerHTML: "", textContent: "" };
	const contract = {
		info: { title: "Reference test", version: "1" },
		paths: {
			"/users/{id}": {
				get: {
					parameters: [{ name: "id", in: "path", required: true,
						schema: { type: "string" }, examples: { user: { value: "user-parameter" } } }],
					responses: {
						200: {
							description: "User",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/User" },
									examples: {
										user: { $ref: "#/components/examples/User" },
										missing: { $ref: "#/components/examples/Missing" },
										external: { externalValue: "https://example.com/user.json" },
									},
								},
							},
						},
					},
				},
			},
			"/users/id": {
				get: {
					responses: {
						200: {
							description: "Users",
							content: {
								"application/json": {
									schema: {
										type: "array",
										items: { $ref: "#/components/schemas/User" },
									},
								},
							},
						},
					},
				},
			},
			"/anything": {
				get: {
					responses: {
						200: {
							description: "Anything",
							content: {
								"application/json": {
									schema: {
										type: "object",
										additionalProperties: true,
									},
								},
							},
						},
					},
				},
			},
			"/example-only": { get: { responses: { 200: {
				description: "Example without schema",
				content: { "application/json": { examples: { zero: { value: 0 } } } },
			} } } },
			"/broken": {
				get: {
					responses: {
						200: {
							description: "Broken",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/Missing" },
								},
							},
						},
					},
				},
			},
		},
		components: {
			examples: { User: { summary: "A named user", description: "<example description>",
				value: { name: "<example user>" } } },
			schemas: {
				User: {
					type: "object",
					required: ["id", "name"],
					properties: {
						id: { type: "string" },
						name: { type: "string", description: "<unsafe>" },
						manager: { $ref: "#/components/schemas/User" },
					},
				},
			},
		},
	};
	const originalDocument = globalThis.document;
	const originalFetch = globalThis.fetch;
	const originalWindow = globalThis.window;
	globalThis.document = {
		querySelector(selector) {
			if (selector === "#reference") return root;
			return { addEventListener() {} };
		},
	};
	globalThis.fetch = async () => ({ ok: true, json: async () => contract });
	globalThis.window = { print() {} };
	try {
		const source = await readFile(rendererPath, "utf8");
		await import(
			`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
		);
	} finally {
		globalThis.document = originalDocument;
		globalThis.fetch = originalFetch;
		globalThis.window = originalWindow;
	}

	assert.match(root.innerHTML, />id<\/code>/);
	assert.match(root.innerHTML, />name<\/code>/);
	assert.match(root.innerHTML, /<span class="required">yes<\/span>/);
	assert.match(root.innerHTML, /Recursive reference/);
	assert.match(root.innerHTML, /Unresolved reference/);
	assert.match(root.innerHTML, /Arbitrary fields allowed/);
	assert.match(root.innerHTML, /&lt;unsafe&gt;/);
	assert.match(root.innerHTML, /A named user/);
	assert.match(root.innerHTML, /&lt;example description&gt;/);
	assert.match(root.innerHTML, /&lt;example user&gt;/);
	assert.match(root.innerHTML, /user-parameter/);
	assert.match(root.innerHTML, /Unresolved reference: #\/components\/examples\/Missing/);
	assert.match(root.innerHTML, /External example: https:\/\/example.com\/user.json/);
	assert.match(root.innerHTML, /<code>0<\/code>/);
	const ids = [...root.innerHTML.matchAll(/class="operation-sheet" id="([^"]+)"/g)].map(
		(match) => match[1],
	);
	assert.equal(new Set(ids).size, ids.length);
});
