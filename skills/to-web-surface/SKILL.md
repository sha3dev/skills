---
name: to-web-surface
description: Build one web application's final interface through visible, incremental collaboration with the user.
disable-model-invocation: true
argument-hint: "[web application]"
---

# To Web Surface

Create only the selected application's disconnected React/Vite interface inside
`<application.path>/surface/`. The code is the deliverable; do not create a
parallel plan or tracking artifact.

## Workflow

1. Run `npm run check:toolchain`, then
   `node .agents/tools/repo-state.mjs --root . --expect already_initialized`.
   Stop on failure. Use its `applications` to select the named `web` application,
   or ask the user when the choice is ambiguous.
2. Read the relevant `PROJECT.md` definition, language, application, and
   relationship entries. Inspect only `<application.path>/surface/` when it
   already exists.
3. If `surface` is `pending`, agree the first visible increment, run the bundled
   `scripts/initialize-web-application.mjs --root . --app <name>`, resolving it
   relative to this `SKILL.md`, then run
   `node .agents/tools/project-progress.mjs --root . --app <name> --phase surface --set in-progress`.
   Run `npm install` and implement the increment. Start with the application
   shell and global navigation unless the user asks otherwise.
4. Keep the application runnable. After each small, coherent increment, apply
   the repository's TypeScript workflow, inspect the rendered result when
   tooling permits, and give the user the exact preview URL. Start only this
   application with `npm run dev --workspace <workspace-name>`. Ask only what is
   needed to choose or refine the next increment.
5. Continue one section, screen, state, or interaction at a time. Use local
   fixtures and client state for realistic behavior. Do not add API calls,
   server code, persistence, authentication, or infrastructure.
6. Only after the user explicitly approves the whole interface and the
   repository check passes, run
   `node .agents/tools/project-progress.mjs --root . --app <name> --phase surface --set complete`.
   Stop without starting another phase.

When revising an approved surface, require an explicit user request and use the
same progress command with `--set in-progress --reopen` before editing. Never
change another application's progress or code.
