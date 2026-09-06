---
name: workflow-run
description: Apply shared entry, verification, process, and approval rules during Flow application surface or API connection workflows.
---

# Workflow Run

The application workflows — `to-web-surface`, `to-api-surface`, `to-worker-surface`, and
`connect-to-api` — start, run processes, and end the same way. This skill is the
single source for those rules; a workflow's own `SKILL.md` states only what is
specific to its phase.

## Browser automation

Before implementation, inspect available tools and advertised browser skills
for a capability that can navigate the local preview, resize its viewport,
inspect rendered output, and exercise interactions. If needed, use the harness's
tool discovery or read the relevant installed browser skill for its CLI entry
point. Confirm the required capabilities; a missing Playwright name or unloaded
browser tool alone does not establish absence. Reuse the selected capability
throughout the run.

For `to-api-surface`, also confirm that available browser or document tooling
can inspect print media or create and render a temporary PDF before
implementation begins.

If no suitable capability is available after that bounded discovery, stop as
`blocked` before implementation. Identify the missing capability and link to
[Browser automation](https://github.com/sha3dev/skills#browser-automation).
Follow the harness's loading requirements when configuration is needed; do not
install or configure unrelated tooling during discovery. User inspection does
not replace browser verification.

## Entry check

Run `npm run check:toolchain` once, as the workflow's entry check. When it
reports that dependencies are not installed, run `npm install` and retry; stop
on any other failure. For increments that change code or its inputs, use `npm run check:code` for
Biome and TypeScript; the final `npm run check` adds project, toolchain, fixture, and
unused-code checks. Do not repeat the standalone entry check between increments.

Read only the current task's relevant artifacts and source; expand inspection
when a concrete dependency or uncertainty requires it. Reuse unchanged context
and successful checks within the run. Keep successful command output concise
where supported, but retain failure diagnostics for investigation.

## Durable context

Each application phase declares and maintains its context entry point under
`.flow/applications/<application-slug>/`: `surface.md` for surfaces, `connect.md`
for connection, and a descriptive name for future phases. The phase defines its
specific contents; `.flow/project.json` remains the sole progress tracker.

Read and apply [Durable context](../interview/references/durable-context.md) for
creation, resumption, updates, and handoff, including outside interviews. This
reference governs document maintenance; it does not initiate an interview or
authorize edits to another application's specification.

## Incremental verification

Group small edits into one reviewable increment. Choose checks by what changed:

- Prose-only changes: proofread the affected content and inspect its rendered
  placement. Recheck responsive or print layout when wrapping or pagination can
  change; reuse unaffected behavior and viewport checks.
- Configuration or contract changes: verify affected values, references, and
  behavior with focused tests and runtime checks.
- Renderer, styling, or interaction changes: inspect affected output at desktop
  and mobile widths; include print when the workflow requires it.

Run `npm run check:code` when code or its inputs change, including text embedded
in source files. Rerun a check only after relevant changes, a failure, or an
unresolved concern. Completion still requires the full project gate and all
phase-specific evidence; reuse passing results only while their inputs remain
unchanged.

## Existing workspaces

Before using an existing workspace, inspect its scripts, entry points, and
preview assets. A `package.json` alone does not establish a usable surface.
Reuse a matching preview; add missing review assets without overwriting runtime
entry points or approved code. Keep review startup free of unrelated side effects.
Follow the workflow's specific adaptation rules; do not rerun a scaffold to
repair an existing workspace.

## Development processes

Run exactly one development server per application involved in the run, at the
fixed URL the generated workspace pins: a web application's `vite.config.ts`,
an API or worker review server's source as reported by its initializer. Start each one before the
first increment that needs it.

Let the running process pick up source changes: a web application through hot
module replacement, an API or worker review server through its watch process. Restart a process only
when it has stopped or when its configuration or dependencies changed, never for
an ordinary code change.

The ports are strict, but occupancy does not prove ownership. Before stopping a
listener, inspect its PID, command, working directory, and application identity.
Reuse a healthy matching server when appropriate. Stop it only when evidence
shows it is an abandoned process for this project and application. If ownership
is unknown or belongs to another project, preserve it, report the fixed-URL
conflict, and stop the workflow. Never fall back to another port.

Processes started by the run belong to it. Leave them running while the workflow
is active, including while the user reviews an increment, and stop them before
the workflow ends for any reason. Do not stop a reused process that the run did
not start.

## Completing a phase

Reuse explicit approval already given for the same scope and unchanged artifact.
Do not ask again merely because a skill or session changed. Plan approval and
final acceptance remain distinct decisions.

A phase moves to `complete` only after the user explicitly approves that
phase's work and the full `npm run check` passes. Present the finished work for
review and wait for that approval; green checks are a precondition, never a
substitute for it. Then set the phase with the workflow's own progress command,
stop the run's development processes, and end the run without starting another
phase.

## Changes and revisions

When project state contains an active change, read its
`.flow/changes/<id>.md` and approved step before implementation. Work only on the
next step of an `implementing` change. Flow owns the change's lifecycle and
already reopened its phases; do not reopen another phase inside this run.
The approved change defines intended contract differences across applications.
Preserve unaffected behavior and update only this step's owning artifacts.
The joint approval satisfies pre-implementation specification confirmation for
decisions it already covers; reuse it instead of interviewing or asking again.
Material new decisions return to Flow for proposal revision and approval.

The approved step order replaces initial discovery prerequisites. Verification,
process ownership, and phase approval remain unchanged; phase completion does
not close the change or establish integrated acceptance.

After initial completion, direct requests to revise a surface enter Flow's
project change cycle first. During unfinished initial construction, explicitly
requested revisions may still use `--set in-progress --reopen` before editing.
Preserve automatic connection, architecture, and domain invalidation in that initial mode.

## Run boundary

A run owns one selected application's phase and only the supporting applications
and processes its workflow explicitly declares. It ends at that workflow's
final step or at a blocker. Everything needed to resume is durable in `.flow/project.json`
and the phase's own artifacts, so a run carries no state between applications.
Do not begin another application's phase inside the run, and do not reuse the
run's interview or increments for one.
