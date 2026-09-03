# TypeScript Stack

## What it does

`typescript-stack` governs application-code changes on the fixed TypeScript
platform: npm workspaces with Turborepo, Node.js with the `tsx` runtime, React
with Vite, and Fastify. It uses the repository's existing Biome, TypeScript,
Knip, and toolchain gates instead of encoding mechanical code-style decisions
in agent instructions.

The skill does not initialize, migrate, or rewrite tooling while application
code is being changed.

## When to reach for it

The skill is selected automatically when an agent writes or changes TypeScript,
TSX, or an opaque JavaScript asset. Reviews and contract-only work do not select
it unless they also require a code change.

## Repository-owned tooling

`setup` creates the canonical configuration and records minimum compatible
versions. Each repository chooses its concrete platform and tool versions; its
`.node-version`, `packageManager`, and `package-lock.json` make those choices
reproducible.

Each `apps/<app>/` directory is an independently runnable workspace, with its
application TypeScript under `src/`. Shared TypeScript lives in `packages/`.
JavaScript delivered without transformation is allowed only under
`apps/<app>/public/`. Biome owns formatting, imports, and recommended lint
rules; TypeScript owns type correctness without emitting JavaScript; Knip owns
unused files, exports, and dependencies.

## Semantic decisions

Agents still own the semantic implementation and comments that explain intent
or invariants. These decisions cannot be delegated to code tooling.

## Common questions

### Does the skill compile TypeScript?

No. Server code runs through the `tsx` runtime, browser code is transformed by
Vite, and TypeScript uses `noEmit` only for static checking.

### Does every repository use identical tool versions?

No. The standard defines compatible minimums. Each repository pins its own
resolved versions and verifies them against those minimums.

### Why are there two check gates?

Because the two kinds of question have different answers mid-task. Formatting,
lint, and types must hold after every edit, so `npm run check:code` runs in the
iteration loop. Reachability must hold only once the work is wired up: a
component written before the screen that renders it is legitimately unused, and
Knip is right to report it and wrong to be obeyed at that moment. The full
`npm run check` adds that analysis and runs at a task or phase boundary, so an
unused-code report there is a real finding rather than a snapshot of unfinished
work.

## No third gate

The two gates are the whole verification surface of a code change. A workflow
may run `npm run check:toolchain` once on entry before implementation. Each
increment then uses `npm run check:code`; the final `npm run check` includes
toolchain verification, so no additional standalone pass is needed.

The verification separates an uninstalled `node_modules` from a broken
toolchain: the first asks for `npm install`, the second is a configuration
problem to report rather than repair mid-change.

## It's working if

Safe Biome fixes are limited to edited paths, the iteration loop stays green on
`npm run check:code` without deleting unfinished work, and the complete
`npm run check` gate is green at the boundary without suppressions or weakened
configuration.

## Where it fits

`setup` materializes the platform once. `typescript-stack` then governs every
application-code change made by later web, API, and worker workflows.
