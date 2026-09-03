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

All application TypeScript lives under `src/`. JavaScript delivered without
transformation is allowed only under `src/<block>/public/`. Biome owns
formatting, imports, and recommended lint rules; TypeScript owns type
correctness without emitting JavaScript; Knip owns unused files, exports, and
dependencies.

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

## It's working if

The read-only toolchain check passes before editing, safe Biome fixes are
limited to edited paths, and the complete repository `npm run check` gate is
green without suppressions or weakened configuration.

## Where it fits

`setup` materializes the platform once. `typescript-stack` then governs every
application-code change made by later web, API, and worker workflows.
