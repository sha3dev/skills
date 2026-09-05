# Workflow Run

## What it does

`workflow-run` centralizes browser availability, toolchain entry checks,
development process ownership, completion, reopening, and run boundaries for
`to-web-surface`, `to-api-surface`, and `connect-to-api`.

## When to reach for it

It is selected automatically by the workflow that is running: on entry, when
starting or restarting a development server, when a phase is ready to be marked
complete, when the user asks to revise a completed phase, and when deciding
whether work belongs to the current run. It
is not a task workflow and never decides what to build.

For an API surface, the entry capability check also covers print-media
inspection or temporary PDF rendering because print review is part of that
workflow's completion evidence.

## It's working if

Each workflow checks available tools, discoverable capabilities, and relevant
installed browser skills before declaring that it cannot operate the rendered
interface. Otherwise it checks the toolchain once, reuses unchanged context and
verification results within the run, verifies process
identity before acting on a fixed-port conflict, requires explicit approval
before completion, reopens only on request, and stays within the selected
workflow's declared application and provider scope.

## Where it fits

`workflow-run` is a model-invoked toolkit skill required by the three workflows
above. `setup` creates the phases and the `.flow/tools/` these rules operate on,
`interview` and `fixtures` cover what a run produces, and `workflow-run` covers
how it behaves.
