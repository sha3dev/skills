---
name: workflow-run
description: Apply the shared run discipline of the application workflows when one of them starts, runs its development servers, revises a completed phase, or ends. Covers the toolchain entry check, single development process ownership at fixed URLs, the user approval a phase needs before it is marked complete, reopening an approved phase, and the run boundary.
---

# Workflow Run

The application workflows — `to-web-surface`, `to-api-surface`, and
`connect-to-api` — start, run processes, and end the same way. This skill is the
single source for those rules; a workflow's own `SKILL.md` states only what is
specific to its phase.

## Entry check

Run `npm run check:toolchain` once, as the workflow's entry check. When it
reports that dependencies are not installed, run `npm install` and retry; stop
on any other failure. Later steps reach the toolchain through `npm run check:code`
and the final `npm run check`, so do not repeat the standalone entry check
between increments.

## Development processes

Run exactly one development server per application involved in the run, at the
fixed URL the generated workspace pins: a web application's `vite.config.ts`,
an API's server source as reported by its initializer. Start each one before the
first increment that needs it.

Let the running process pick up source changes: a web application through hot
module replacement, an API through its watch process. Restart a process only
when it has stopped or when its configuration or dependencies changed, never for
an ordinary code change.

The ports are strict and only one run owns them at a time, so a port conflict
means an abandoned process holds the URL. Stop that process and start again on
the same port. Never fall back to another port: an abandoned server keeps
answering the fixed URL, later with another application's content.

These processes belong to the run. Leave them running while the workflow is
active, including while the user reviews an increment, and stop all of them
before the workflow ends for any reason: completion, a blocker, or abandoning
the work.

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
editing anything. Never change another application's progress or code.

## Run boundary

A run covers one phase of one application and ends at that workflow's final step
or at a blocker. Everything needed to resume is durable in `.flow/project.json`
and the phase's own artifacts, so a run carries no state between applications.
Do not begin another application's phase inside the run, and do not reuse the
run's interview or increments for one.
