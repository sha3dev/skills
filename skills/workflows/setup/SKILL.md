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
  names, and each directed pair appears at most once. Direction follows runtime
  use from consumer to provider; a web application that calls an API is
  recorded as `web -> api`. Workers describe background responsibilities; their
  relationships record dependencies without adding an integration phase.

The temporary JSON contains exactly `title`, `definition`, `terms`,
`applications`, and `relationships`, with only the nested fields above. All text
values are non-empty and single-line. External dependencies and infrastructure
are outside setup.

The generator derives a unique kebab-case path under `apps/` from each
application name and initializes a progress phase named after its type,
`<type>-surface`, as `pending`. A `web` application with an outgoing
relationship to an `api` also receives an `api-connection` phase as `pending`.
`.flow/project.json` is the sole persistent source for these values, paths, and
progress.

The generated project also has top-level `progress.architecture-surface: pending` and
`progress.domain-surface: pending`, in that order.
Later, Flow records project changes in an optional `changes` array, using the
generated progress writer and its `project-changes.mjs` helper. Setup creates
no change records or empty change directories.
These project-wide phases follow all application phases: infrastructure and
environment configuration approval first, then domain code structure design.

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
2. Using the argument and conversation context, agree every contract value. Reuse explicit decisions from the request. Propose concise domain definitions
   and relationships; ask only about material ambiguity or missing context.
   The generated proposal below provides joint confirmation of the foundation.
3. Write the agreed JSON to a temporary file outside the repository. Run the bundled `scripts/initialize-repository.mjs` with `--root .`, `--input <temporary-file>`, and `--dry-run`.
4. Present the generated `.flow/project.json` for approval. Do not manually create or edit any output.
5. After approval, run the same command with the same input using `--write`, then run `npm install` and `npm run check`. Report the results, remove the temporary input, and stop. Do not start another workflow stage.

The scripts own validation, rendering, collision detection, writing, and
rollback. Never bypass them or merge with existing output.
