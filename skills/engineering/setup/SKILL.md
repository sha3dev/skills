---
name: setup
description: Initialize an empty repository with its project definition, typed solution topology, agent entrypoints, and fixed TypeScript toolchain. Run once before any other workflow skill.
disable-model-invocation: true
argument-hint: "[rough idea]"
---

# Setup

Initialize durable project context and the predefined platform only. Do not
choose product-specific technologies, define detailed requirements or internal
architecture, or implement application code.

## Process

1. Before exploring or asking questions, run `node scripts/repo-state.mjs --root . --expect ready_for_setup`, resolving the script relative to this `SKILL.md`. On failure, return its JSON result and stop.
2. Read [references/input-contract.md](references/input-contract.md) and [references/document-contracts.md](references/document-contracts.md). Using the argument and conversation context, agree the project definition and repository-owned blocks. Every repository block has exactly one type: `web`, `api`, or `worker`.
3. Ask what each block must interact with. Link an existing block or propose a missing repository or external block for confirmation. Capture only logical interactions; do not define URLs, protocols, databases, queues, deployments, or other infrastructure. Continue until every named interaction has two confirmed blocks and a concise purpose.
4. Write the agreed input JSON to a temporary file outside the repository. Run the bundled `scripts/initialize-repository.mjs` with `--root .`, `--input <temporary-file>`, and `--dry-run`.
5. Present the generated preview for approval. Do not manually create or edit any output.
6. After approval, run the same command with the same input using `--write`, then run `npm install` and `npm run check:toolchain`. Report the results, remove the temporary input, and stop. Do not start another workflow stage.

The scripts own validation, collision detection, rendering, directory creation, file copying, and rollback. Never bypass them or merge with existing output.
