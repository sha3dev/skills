---
name: setup
description: Initialize an empty repository with its product foundation, domain language, typed solution topology, and fixed TypeScript toolchain. Run once before any other workflow skill.
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
- One or more solution `blocks`, each with a `name` unique ignoring case, a
  one-sentence `responsibility`, and one `type`: `web`, `api`, or `worker`.
- Zero or more directed `relationships`, each with `from`, `to`, and a
  one-sentence `description`. References exactly match two different block
  names, and each directed pair appears at most once.

The temporary JSON contains exactly `title`, `definition`, `terms`, `blocks`,
and `relationships`, with only the nested fields above. All text values are
non-empty and single-line. External dependencies and infrastructure are outside
setup.

The generator derives a unique kebab-case `src/` path from each block name.
`PROJECT.md` is the sole persistent source for these values and paths. It keeps
an empty Language section when there are no terms and omits Relationships when
there are none. Setup does not create empty block directories.

## Process

1. Before exploring or asking questions, run `node scripts/repo-state.mjs --root . --expect ready_for_setup`, resolving the script relative to this `SKILL.md`. On failure, return its JSON result and stop.
2. Using the argument and conversation context, agree every contract value. For
   each product-specific term introduced by the user, propose a concise
   definition and ask for confirmation. Ask what each block interacts with and
   propose missing solution blocks for confirmation.
3. Write the agreed JSON to a temporary file outside the repository. Run the bundled `scripts/initialize-repository.mjs` with `--root .`, `--input <temporary-file>`, and `--dry-run`.
4. Present the generated `PROJECT.md` for approval. Do not manually create or edit any output.
5. After approval, run the same command with the same input using `--write`, then run `npm install` and `npm run check:toolchain`. Report the results, remove the temporary input, and stop. Do not start another workflow stage.

The scripts own validation, rendering, collision detection, writing, and
rollback. Never bypass them or merge with existing output.
