# Workflow Run

## What it does

`workflow-run` holds the rules the application workflows share: the toolchain
entry check, ownership of development processes at fixed URLs, how an approved
phase is reopened, and where one run starts and ends. `to-web-surface`,
`to-api-surface`, and `connect-to-api` state only what is specific to their
phase and defer to this skill for the rest, so the three behave identically at
their edges and a change to those rules happens in one place.

## When to reach for it

It is selected automatically by the workflow that is running: on entry, when
starting or restarting a development server, when the user asks to revise a
completed phase, and when deciding whether work belongs to the current run. It
is not a task workflow and never decides what to build.

## It's working if

Each workflow verifies the toolchain once on entry instead of between
increments, one development process per application answers its fixed URL and
is stopped when the workflow ends, a completed phase moves back only through an
explicit request and `--set in-progress --reopen`, and a run never drifts into a
second application's phase.

## Where it fits

`workflow-run` is a model-invoked toolkit skill required by every application
workflow. `setup` creates the phases and the `.flow/tools/` these rules operate
on, `interview` and `fixtures` cover what a run produces, and `workflow-run`
covers how it behaves.
