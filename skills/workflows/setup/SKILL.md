---
name: setup
description: Initialize an empty repository with its product foundation, domain language, typed applications, and fixed TypeScript toolchain. Run once before any other workflow skill.
disable-model-invocation: true
argument-hint: "[rough idea]"
---

# Setup

Initialize durable project context and the predefined platform only. Do not
choose product-specific technologies, define detailed requirements or internal
architecture, or implement application code.

## Contract

Use technical English. Agree these values:

- A project `title` and concise `definition`.
- Zero or more confirmed domain `terms`, each with a `term` and one-sentence
  `definition`. Term names are unique ignoring case. Exclude implementation and
  general programming terminology.
- One or more `applications`, each with a `name` unique ignoring case, a
  one-sentence `responsibility`, and one `type`: `web`, `api`, or `worker`.
- Zero or more directed `relationships`, each with `from`, `to`, and a
  one-sentence `description`. References exactly match two different application
  names, and each directed pair appears at most once.

The temporary JSON contains exactly `title`, `definition`, `terms`,
`applications`, and `relationships`, with only the nested fields above. All text
values are non-empty and single-line. External dependencies and infrastructure
are outside setup.

The generator derives a unique kebab-case path under `apps/` from each
application name and initializes one progress phase named after its type,
`<type>-surface`, as `pending`.
`.flow/project.json` is the sole persistent source for these values, paths, and
progress.
Later surface workflows may create shared deterministic domain records under
`.flow/fixtures/`; setup reserves that location and installs its validator but
does not create an empty fixture directory or choose product data.
It keeps empty `terms` and `relationships` arrays when there are none. Setup
configures npm workspaces and Turborepo
so each declared `apps/<app>/` path becomes a workspace when materialized, but
does not create empty application directories. Application source belongs under
that workspace's `src/` directory. Name application workspaces `@apps/<slug>`
and reusable package workspaces `@packages/<slug>`.

## Process

1. Before exploring or asking questions, run `node scripts/repo-state.mjs --root . --expect ready_for_setup`, resolving the script relative to this `SKILL.md`. On failure, return its JSON result and stop.
2. Using the argument and conversation context, agree every contract value. For
   each product-specific term introduced by the user, propose a concise
   definition and ask for confirmation. Ask what each application interacts with
   and propose missing applications for confirmation.
3. Write the agreed JSON to a temporary file outside the repository. Run the bundled `scripts/initialize-repository.mjs` with `--root .`, `--input <temporary-file>`, and `--dry-run`.
4. Present the generated `.flow/project.json` for approval. Do not manually create or edit any output.
5. After approval, run the same command with the same input using `--write`, then run `npm install` and `npm run check`. Report the results, remove the temporary input, and stop. Do not start another workflow stage.

The scripts own validation, rendering, collision detection, writing, and
rollback. Never bypass them or merge with existing output.
