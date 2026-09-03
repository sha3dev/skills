---
name: typescript-stack
description: "Write application code on the fixed Node.js/tsx, React/Vite, and Fastify stack. Use for TypeScript, TSX, and opaque JavaScript assets."
---

# TypeScript Stack

Use the repository-provided platform. Server `.ts` runs through the `tsx`
runtime without precompilation; `tsx` and the `.tsx` JSX extension are
unrelated. Opaque `.js` stays untouched by code tooling and is allowed only
under `apps/<app>/surface/public/`; all other application source uses TypeScript
or TSX inside `apps/` or `packages/`.

Biome owns formatting, imports, naming, and lint rules. TypeScript with
`noEmit` owns type correctness. Knip owns unused files, exports, and
dependencies. Do not reproduce their rules in prose or subjective review.

## Workflow

1. Run `npm run check:toolchain` at the repository root. If it is missing
   or fails, report the exact configuration problem and stop; do not initialize
   or migrate tooling during a code change.
2. Implement the requested behavior. Comments explain only intent or invariants.
3. Run `npm run fix -- <edited-paths>` for safe Biome fixes, then `npm run check`.
   Resolve diagnostics at their source and repeat until green.

Never use unsafe fixes, suppress checks, or change their configuration to pass.
