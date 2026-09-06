---
name: typescript-stack
description: Implement TypeScript or browser JavaScript in initialized Flow projects using their fixed toolchain. Does not apply outside Flow.
---

# TypeScript Stack

Use the repository-provided platform. Server `.ts` runs through the `tsx`
runtime without precompilation; `tsx` and the `.tsx` JSX extension are
unrelated. Each `apps/<app>/` directory is a workspace whose application source
belongs under `src/`. Opaque `.js` stays untouched by code tooling and is
allowed only under `apps/<app>/public/`; shared source belongs in `packages/`.
Shared TypeScript workspaces must declare a `typecheck` script and consumers
must declare their workspace dependencies so Turbo invalidates dependent checks.

Biome owns formatting, imports, naming, and lint rules. TypeScript with
`noEmit` owns type correctness. Knip owns unused files, exports, and
dependencies. Do not reproduce their rules in prose or subjective review.

## Checks

Use `npm run fix -- <edited-paths>` for safe Biome fixes when needed, and
`npm run check:code` after a coherent code change. Run `npm run check` at task
completion. During application workflows, `workflow-run` owns check timing,
entry checks, and evidence reuse; do not run a second verification sequence.
Resolve diagnostics at their source. Never use unsafe fixes, suppress checks,
or change toolchain configuration merely to pass.

## Unused code

`check:code` holds only what must be true of every intermediate state:
formatting, lint, and types. `check` adds Knip, which asks a different
question — is this code reachable from an entry point yet? A component written
before the screen that renders it, or a fixture written before its consumer, is
a legitimate `Unused files` report, and deleting it to reach green destroys
correct work.

So run Knip at a boundary where the answer is meaningful: the end of a task or
phase, when everything written is expected to be wired up. If Knip still
reports code as unreachable there, that is a real finding — connect it or
remove it. Never silence it by widening `knip.json`.
