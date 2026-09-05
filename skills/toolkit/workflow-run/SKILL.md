---
name: workflow-run
description: Apply the shared run discipline when `to-web-surface`, `to-api-surface`, or `connect-to-api` runs in an initialized Flow project, including browser availability, entry checks, process ownership, completion, reopening, and run boundaries.
---

# Workflow Run

The application workflows — `to-web-surface`, `to-api-surface`, and
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
on any other failure. Later increments use `npm run check:code` for Biome and
TypeScript; the final `npm run check` adds project, toolchain, fixture, and
unused-code checks. Do not repeat the standalone entry check between increments.

Read only the current task's relevant artifacts and source; expand inspection
when a concrete dependency or uncertainty requires it. Reuse unchanged context
and successful checks within the run. Keep successful command output concise
where supported, but retain failure diagnostics for investigation.

## Development processes

Run exactly one development server per application involved in the run, at the
fixed URL the generated workspace pins: a web application's `vite.config.ts`,
an API's server source as reported by its initializer. Start each one before the
first increment that needs it.

Let the running process pick up source changes: a web application through hot
module replacement, an API through its watch process. Restart a process only
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

A phase moves to `complete` only after the user explicitly approves that
phase's work and the full `npm run check` passes. Present the finished work for
review and wait for that approval; green checks are a precondition, never a
substitute for it. Then set the phase with the workflow's own progress command,
stop the run's development processes, and end the run without starting another
phase.

## Revising a completed phase

Reopening an approved phase requires an explicit user request. Move it back with
the workflow's own progress command using `--set in-progress --reopen` before
editing anything. Stay within the workflow's declared application and provider
scope. Automatic connection invalidation by the progress tool is allowed, as
are provider configuration changes that the selected workflow explicitly
requires; neither reopens a provider's product contract or authorizes unrelated
application work.

## Run boundary

A run owns one selected application's phase and only the supporting applications
and processes its workflow explicitly declares. It ends at that workflow's
final step or at a blocker. Everything needed to resume is durable in `.flow/project.json`
and the phase's own artifacts, so a run carries no state between applications.
Do not begin another application's phase inside the run, and do not reuse the
run's interview or increments for one.
