# Agent instructions

## Working principles

- Keep responses concise, direct, and information-dense. Preserve necessary technical details, warnings, and requested explanations.
- Write technical project artifacts in English.

## Project context

Project context and solution boundaries are indexed in [SOLUTION-MAP.md](./SOLUTION-MAP.md). Read it before exploring the repository and follow only the links relevant to the task. Keep each fact in its canonical document: global definition in `PROJECT.md`; repository block type, responsibility, contents, and reading guidance in its `FOLDER.md`; navigation, logical relationships, and external block definitions in `SOLUTION-MAP.md`.

## Application code

- Keep all TypeScript and TSX application code under `src/`, organized by the solution blocks defined in `SOLUTION-MAP.md`.
- Store JavaScript that must be delivered byte-for-byte only under `src/<block>/assets/`; use `.js` and do not modify it with code tooling.
- Use `npm install` only when intentionally changing dependencies or the lockfile; otherwise use `npm ci` for a reproducible installation.
- Run `npm run check:toolchain` before changing application code and `npm run check` before finishing.
- Treat Biome, TypeScript, Knip, and the repository toolchain check as the authorities for mechanically enforceable rules.
- Do not add ESLint, Prettier, oxlint, or dprint; Biome is the sole formatter and linter.
