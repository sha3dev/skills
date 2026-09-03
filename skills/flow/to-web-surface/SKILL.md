---
name: to-web-surface
description: Specify and build one web application's final interface through a persistent design interview and visible incremental implementation.
disable-model-invocation: true
argument-hint: "[web application]"
---

# To Web Surface

Create only the selected application's disconnected React/Vite interface inside
`<application.path>/surface/`. Maintain its durable interface specification at
`<application.path>/SURFACE.md`; it is the source of truth for the intended UI,
while `PROJECT.md` remains the sole progress tracker.

## Workflow

1. Run `npm run check:toolchain`, then
   `node .agents/tools/repo-state.mjs --root . --expect already_initialized`.
   Stop on failure. Use its `applications` to select the named `web` application,
   or ask the user when the choice is ambiguous.
2. Read the relevant `PROJECT.md` definition, language, application, and
   relationship entries. Read `<application.path>/SURFACE.md` first when it
   exists, then inspect `<application.path>/surface/` when implementation already
   exists. Create `SURFACE.md` if absent, seeded only with facts from those
   sources and the user's request. If `surface` is `pending`, change it to
   `in-progress` with
   `node .agents/tools/project-progress.mjs --root . --app <name> --phase surface --set in-progress`.
3. Use `$interview` before implementation, using
   `SURFACE.md` as its durable artifact. Its subject-specific lens is the UI's
   purpose and audience, journeys, information architecture, screens, states,
   interactions, content and data assumptions, visual direction, responsive
   behavior, and accessibility. Follow only branches that are relevant to this
   interface; do not turn the lens into a questionnaire. Write technical prose
   in English while preserving the established language of interface copy.
4. The interview is complete when an implementer could build the interface
   without inventing a product decision. Mark `SURFACE.md` as awaiting
   confirmation and present it. After the user confirms it, record that status
   before writing interface code.
5. If the workspace does not exist, run the bundled
   `scripts/initialize-web-application.mjs --root . --app <name>` relative to
   this `SKILL.md`, then `npm install`. Implement one small, coherent increment
   at a time, starting with the shell and global navigation unless the
   specification implies a better order. Use local fixtures and client state;
   do not add APIs, server code, persistence, authentication, or infrastructure.
6. After each increment, apply the repository's TypeScript workflow and run
   only this application with
   `npm run dev --workspace <workspace-name>`. Before presenting the increment,
   use available browser tooling to inspect it at representative desktop and
   mobile widths and exercise the changed interactions. Ensure it follows the
   user's established direction, has no visible or functional errors, lays out
   correctly at both widths, and remains reasonably coherent with the existing
   interface. Adjust or redesign what is needed to reach that threshold, then
   stop refining once the result is good enough for user review. Give the user
   the exact preview URL. Use `$interview` again when review reveals a product
   decision, and record that decision in `SURFACE.md` before changing the code.
7. Only after the user explicitly approves the whole interface and the
   repository check passes, run
   `node .agents/tools/project-progress.mjs --root . --app <name> --phase surface --set complete`.
   Stop without starting another phase.

When revising an approved surface, require an explicit user request and use the
same progress command with `--set in-progress --reopen` before editing. Never
change another application's progress or code.
