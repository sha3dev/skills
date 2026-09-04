# REST API Design

## What it does

`rest-api-design` supplies resource-oriented HTTP conventions for deciding what
an API exposes: resource names, methods and paths, request and response
representations, status codes, and filtering, ordering, and pagination. Its
reference files are read only when the current decision touches their subject.

## When to reach for it

The skill is selected automatically while an HTTP contract is being shaped,
before or alongside its implementation. It is not a framework guide and does not
decide product behavior; it only keeps the contract consistent once the behavior
is confirmed.

## It's working if

Resources read as nouns, collections are plural and consistent, each operation
uses the method and status codes its semantics imply, error responses carry a
usable code and message, and collection endpoints agree on one filtering,
ordering, and pagination convention.

## Where it fits

`to-api-surface` owns the product interview, the durable contract, and the
approval boundary; `rest-api-design` shapes the HTTP form of the decisions that
interview produces, and `fastify-best-practices` implements them. This skill is
adapted from AJ Geddes'
[rest-api-design](https://github.com/aj-geddes/useful-ai-prompts/tree/main/skills/rest-api-design),
revision `cf2b16f5db89294720543eb5190e7bd3f9e22f64`, distributed under its
included MIT license. The upstream Express.js example, handwritten OpenAPI
template, and validation script stub are omitted: this platform is Fastify-only
and generates OpenAPI from route schemas. Authentication and rate limiting are
omitted because API surfaces do not design them.
