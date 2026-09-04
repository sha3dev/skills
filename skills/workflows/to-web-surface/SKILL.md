---
name: to-web-surface
description: Specify, build, or resume one initialized web application's interface through a persistent design interview and visible incremental implementation.
disable-model-invocation: true
argument-hint: "[web application]"
---

# To Web Surface

Create only the selected application's disconnected React/Vite interface inside
`<application.path>/`, with application source under `src/`. Maintain its
durable interface specification at `.flow/applications/<application-slug>/surface.md`,
where `<application-slug>` is the final directory in `<application.path>`. It is
the source of truth for the intended UI, while `.flow/project.json` remains the
sole progress tracker.

## Workflow

1. Run `node .flow/tools/repo-state.mjs --root . --expect already_initialized`
   and stop on failure. Use its `applications` to select the named `web`
   application, or ask the user when the choice is ambiguous. Then apply
   `$workflow-run`'s entry check.
2. Read the relevant `.flow/project.json` definition, terms, application, and
   relationship entries. Read
   `.flow/applications/<application-slug>/surface.md` first when it exists, then
   inspect `<application.path>/src/` when implementation already exists. Create
   `surface.md` at that path if absent, seeded only with facts from those sources
   and the user's request. If `web-surface` is `pending`, change it to
   `in-progress` with
   `node .flow/tools/project-progress.mjs --root . --app <name> --phase web-surface --set in-progress`.
3. Use `$interview` before implementation, using
   `surface.md` as its durable artifact. Its subject-specific lens is the UI's
   purpose and audience, journeys, information architecture, screens, states,
   interactions, content and data assumptions, visual direction, responsive
   behavior, and accessibility. Record required domain entities and meaningful
   data states without duplicating concrete fixture records in `surface.md`.
   Follow only branches that are relevant to this interface; do not turn the
   lens into a questionnaire. Write technical prose in English while preserving
   the established language of interface copy.
4. The interview is complete when an implementer could build the interface
   without inventing a product decision. Mark `surface.md` as awaiting
   confirmation and present it. After the user confirms it, record that status
   before writing interface code.
5. If the workspace does not exist, run the bundled
   `scripts/initialize-web-application.mjs --root . --app <name>` relative to
   this `SKILL.md`, then `npm install`. Implement one small, coherent increment
   at a time, starting with the shell and global navigation unless the
   specification implies a better order. Use `$fixtures` to create or extend
   the shared records under `.flow/fixtures/`. Access them through a replaceable
	local repository or equivalent data-source boundary so components and domain
	logic use production-facing names and do not import fixtures directly. Model
	repository operations that can cross an application boundary as asynchronous
	from the start, even though the local implementation resolves immediately, so
	a later HTTP adapter does not reshape its consumers. Treat fixture files as
	immutable initial state. When confirmed interactions require writes, clone
	the records into application memory and make changes observable until the
	page reloads; never write them back to `.flow/fixtures/`. Keep visual state in
	the application; do not add APIs, server code, persistence, authentication,
	or infrastructure.
6. Serve this application with `npm run dev --workspace <workspace-name>` in
   the background, at the fixed preview URL its `vite.config.ts` pins, under
   `$workflow-run`'s development process rules.
7. After an increment that changes `.flow/fixtures/`, apply `$fixtures`'
   validation procedure. After every increment, apply the repository's
   TypeScript workflow through `npm run check:code`. An increment may leave
   interface code that nothing renders yet; that is not a defect to fix, so do
   not run the unused-code
   check between increments and never delete unwired work to satisfy one.
   Before presenting the increment, use available browser tooling to inspect it at
   representative desktop and mobile widths and exercise the changed
   interactions. Ensure it follows the
   user's established direction, has no visible or functional errors, lays out
   correctly at both widths, and remains reasonably coherent with the existing
   interface. Adjust or redesign what is needed to reach that threshold, then
   stop refining once the result is good enough for user review. Give the user
   the preview URL. If browser tooling is unavailable, state that visual
   verification is pending and do not treat the increment as reviewed until
   the user confirms its desktop and mobile behavior. Use `$interview` again
   when review reveals a product decision, and record that decision in
   `surface.md` before changing the code.
8. Only after the user explicitly approves the whole interface, the full
   `npm run check` passes, including its unused-code check, and
   `npm run build --workspace <workspace-name>` succeeds, run
   `node .flow/tools/project-progress.mjs --root . --app <name> --phase web-surface --set complete`.
   Stop the development server and stop without starting another phase.

## Run discipline

Apply `$workflow-run` for the entry check, development process ownership,
revising an approved surface, and the run boundary. This run is one `web`
application's surface: it starts at step 1 and ends at step 8 or at a blocker,
and it resumes from `.flow/project.json` and the application's `surface.md`.
