# Agent instructions

`.flow/project.json` is the canonical entry point for the product definition,
domain language, applications, relationships, and workflow progress. Read its
relevant sections before application work.

Write technical project artifacts in English. Each application path declared in
`.flow/project.json` becomes an npm workspace when materialized, and its source
belongs under `src/`. Applications share source only through packages under
`packages/`. Name application workspaces `@apps/<slug>` and reusable package
workspaces `@packages/<slug>`.
