---
name: typescript-stack
description: "Implement or change application code on the repository's fixed TypeScript stack: Node.js/tsx, React/Vite, and Fastify."
---

# TypeScript Stack

Use only the repository-provided platform: TypeScript with native ESM on
Node.js, React with Vite, Fastify, and npm. Run server `.ts` files through the
`tsx` runtime without a JavaScript precompile step.

Biome owns formatting, imports, naming, and lint rules. TypeScript with
`noEmit` owns type correctness. Knip owns unused files, exports, and
dependencies. Do not reproduce their rules in prose or subjective review.

The `tsx` runtime and the `.tsx` JSX extension are unrelated concepts.

## Workflow

1. Run `npm run check:toolchain` at the relevant package root. If it is missing
   or fails, report the exact configuration problem and stop; do not initialize
   or migrate tooling during a code change.
2. Make the smallest semantic change. Use technical English; comments explain
   only intent or invariants.
3. Run `npm run fix -- <edited-paths>` for safe Biome fixes, then `npm run check`.
   Resolve diagnostics at their source and repeat until green.

Never use unsafe fixes, suppress checks, or change their configuration to pass.
Limit automatic fixes to edited paths so unrelated work is preserved.
