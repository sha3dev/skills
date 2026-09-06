---
name: to-worker-surface
description: Specify or revise one initialized worker application's background processes and configuration through a persistent interview and concise visual contract documentation.
disable-model-invocation: true
argument-hint: "[worker application]"
---

# To Worker Surface

Create a read-only review page inside the selected worker's `<application.path>/`,
with source under `src/`. Record agreed decisions at
`.flow/applications/<application-slug>/surface.md`, where the slug is the final
application directory. `.flow/project.json` remains the sole progress tracker.
This phase delivers a documented worker contract, not a running background service.

## Workflow

1. Run `node .flow/tools/repo-state.mjs --root . --expect already_initialized`
   and stop on failure. Select the named `worker` application from its result;
   ask only if ambiguous. Apply `$workflow-run`'s entry check and run discipline.
2. Read the relevant project definition, terms, relationships, and existing
   `surface.md`. Inspect related contracts or existing worker configuration only
   to resolve concrete dependencies. Preserve existing runtime code; do not
   connect providers or change their contracts. Create `surface.md` if absent.
   Move a pending phase to `in-progress` using
   `node .flow/tools/project-progress.mjs --root . --app <name> --phase worker-surface --set in-progress`.
3. Use `$interview` with `surface.md` as its durable artifact. Establish each
   process's purpose, trigger, inputs, and result. For recurring work, clarify
   interval or schedule and timezone when relevant; for event-driven work,
   name the event, source, and conditions. Resolve overlap, retries, missed runs,
   or duplicate handling only when they affect the confirmed responsibility.
   Do not invent queues, infrastructure, or optional settings.
4. Agree configuration names, types, defaults (or no default), units, and one
   short sentence explaining each setting's effect. Record source and when
   changes take effect; add allowed values, limits, or required conditions only
   when needed. Never store secret values in the review contract. Finish when
   the behavior can be described without inventing product decisions. Present
   the concise specification and record confirmation before implementation.
5. If no workspace exists, run the bundled
   `scripts/initialize-worker-application.mjs --root . --app <name>` relative to
   this skill, then `npm install`. For an existing workspace, apply
   `$workflow-run`'s workspace check and read
   [existing-workspace.md](references/existing-workspace.md) before adding a
   missing preview. Populate its typed contract module from the
   confirmed decisions. Preserve configuration names exactly. Keep configuration
   in one catalog: descriptions use
   `{ config: "SETTING_NAME" }` references, never manually repeated values.
   The renderer resolves those references to highlighted names and defaults
   with links to their explanations. Existing runtime configuration must supply
   those same definitions through a safe projection; never read or expose live
   environment values. For a new worker, the catalog is its intended configuration
   contract for later implementation, not evidence of runtime behavior.
6. Build one small reviewable increment at a time. Reuse the bundled renderer
   and styles, preserving the API review document's typography, blue accents,
   neutral palette, and white page treatment. Apply `$frontend-design` only for
   new visual decisions within that direction. Show a
   brief purpose, short process descriptions covering what happens and when,
   then every configuration entry with its type, default, unit, and effect.
   Show source and change timing once when shared. Keep all content visible by
   scrolling, with readable mobile layout and keyboard-accessible anchor links.
   Use plain, concise sentences. Remove filler, repeated explanations, and
   generic operational advice. Do not add simulations, editable controls,
   execution buttons, dashboards, or background tasks. Serve only this review
   page from the workspace's fixed local URL using its watch process.
7. Apply `$workflow-run`'s incremental verification rules. For changed
   configuration or references, test the rendered values and anchor targets.
   For changed serving behavior, verify the page with an external HTTP request.
   For visual changes, inspect the affected page and links in the browser.
   Check that every reference resolves, defaults match the catalog,
   secrets remain undisclosed, and all configuration is explained. Tests should
   cover meaningful rendering and reference failures, not prose snapshots.
   Give the user the fixed URL. Resolve new product decisions with `$interview`
   and update `surface.md` before changing the contract.
8. Complete `worker-surface` under `$workflow-run`'s completion rule: passing
   workspace tests, verified whole-page desktop/mobile
   review, and explicit user approval of the whole contract. Then run
   `node .flow/tools/project-progress.mjs --root . --app <name> --phase worker-surface --set complete`.
   Report this as an approved worker surface, not an operational worker.

## Run discipline

Apply `$workflow-run` for entry, process ownership, completion, explicit reopening,
and run boundaries. One run owns one worker surface and resumes from project
state and its `surface.md`. Runtime scheduling, event delivery, persistence, and
external integrations belong to separately scoped implementation work.
