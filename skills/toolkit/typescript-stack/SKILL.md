---
name: typescript-stack
description: "Write application code on the fixed Node.js/tsx, React/Vite, and Fastify stack. Use for TypeScript, TSX, and opaque JavaScript assets."
---

# TypeScript Stack

Use the repository-provided platform. Server `.ts` runs through the `tsx`
runtime without precompilation; `tsx` and the `.tsx` JSX extension are
unrelated. Each `apps/<app>/` directory is a workspace whose application source
belongs under `src/`. Opaque `.js` stays untouched by code tooling and is
allowed only under `apps/<app>/public/`; shared source belongs in `packages/`.

Biome owns formatting, imports, naming, and lint rules. TypeScript with
`noEmit` owns type correctness. Knip owns unused files, exports, and
dependencies. Do not reproduce their rules in prose or subjective review.

## Workflow

1. Implement the requested behavior. Comments explain only intent or invariants.
2. Run `npm run fix -- <edited-paths>` for safe Biome fixes, then
   `npm run check:code`. Resolve diagnostics at their source and repeat until
   green.
3. Run `npm run check` before handing the work back, and again before any
   workflow records a phase as complete.

These two gates are the only verification a code change performs. A workflow
may run `npm run check:toolchain` once on entry before implementation. Do not
repeat that standalone check during implementation because the final `npm run
check` already includes it. When verification reports that dependencies are
not installed, run `npm install` and retry. When it reports a toolchain
configuration problem, report that problem and stop; do not initialize or
migrate tooling during a code change.

Never use unsafe fixes, suppress checks, or change their configuration to pass.

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
