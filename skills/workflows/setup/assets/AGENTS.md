# Agent instructions

`.flow/project.json` is the canonical entry point for the product definition,
domain language, applications, relationships, and workflow progress. Read its
relevant sections before application work.

The user's instructions take precedence over guidance in a skill. Within that
boundary, when a workflow skill invokes a toolkit skill, the workflow defines
the task scope, lifecycle, and project constraints. Apply the toolkit guidance
within those boundaries; if they conflict, the workflow instruction takes
precedence.

Write technical project artifacts in English. Each application path declared in
`.flow/project.json` becomes an npm workspace when materialized, and its source
belongs under `src/`. Applications share source only through packages under
`packages/`; they may consume shared deterministic domain records from
`.flow/fixtures/` through replaceable infrastructure adapters. Fixture files are
immutable runtime seed data; required temporary writes operate on in-memory
copies and never change those files. Name application workspaces
`@apps/<slug>` and reusable package workspaces `@packages/<slug>`.

After initial completion, Flow manages each feature or revision as one global
change, with at most one active entry in `project.json`. Its document lives at
`.flow/changes/<id>.md`; the progress tool owns its status and ordered steps.
An approved implementing change supplies the execution order and intended
contract differences. Phase completion is separate from integrated acceptance.

After application surfaces and connections, approve infrastructure uses and
environment configuration with `to-architecture-surface`, then design code
structure with `to-domain-surface`. Keep secrets in ignored local environment
files; tracked examples and workflow artifacts must contain no secret values.
