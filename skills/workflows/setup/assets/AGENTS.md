# Agent instructions

`.flow/project.json` is the canonical entry point for the product definition,
domain language, applications, relationships, and workflow progress. Read its
relevant sections before application work.

When a workflow skill invokes a toolkit skill, the workflow defines the task
scope, lifecycle, and project constraints. Apply the toolkit guidance within
those boundaries; if they conflict, the workflow instruction takes precedence.

Write technical project artifacts in English. Each application path declared in
`.flow/project.json` becomes an npm workspace when materialized, and its source
belongs under `src/`. Applications share source only through packages under
`packages/`; they may consume shared deterministic domain records from
`.flow/fixtures/` through replaceable infrastructure adapters. Fixture files are
immutable runtime seed data; required temporary writes operate on in-memory
copies and never change those files. Name application workspaces
`@apps/<slug>` and reusable package workspaces `@packages/<slug>`.
