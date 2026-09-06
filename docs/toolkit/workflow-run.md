# Workflow Run

## What it does

`workflow-run` centralizes browser availability, toolchain entry checks,
proportional incremental verification, existing workspace checks, development
process ownership, compact durable context, completion, reopening, and run boundaries for
`to-web-surface`, `to-api-surface`, `to-worker-surface`, and `connect-to-api`.

## When to reach for it

It is selected automatically by the workflow that is running: on entry, when
starting or restarting a development server, when a phase is ready to be marked
complete, when an approved project change revisits a phase, and when deciding
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
before phase completion, follows the active approved change, and stays within the selected
workflow's declared application and provider scope. Text edits receive content
and affected layout checks; contract and implementation changes receive relevant
functional checks. Final approval retains the full completion gate. Existing
workspaces preserve runtime entry points while missing preview assets are added.
Narrative context follows the shared [durable-context contract](../../skills/toolkit/interview/references/durable-context.md)
throughout the run, with selective reading of referenced detail.
Every application phase has its own context entry point: `surface.md`,
`connect.md`, or a descriptive name declared by a future workflow. Each can
reference a matching directory of detail without becoming another progress tracker.

## Where it fits

`workflow-run` is a model-invoked toolkit skill required by the application workflows
above. `setup` creates the phases and the `.flow/tools/` these rules operate on,
`interview` and `fixtures` cover what a run produces, and `workflow-run` covers
how it behaves.

After initial completion, Flow owns global changes and reopens their planned
phases. Workflow Run applies the next step's approved contract differences and
execution order while retaining phase-specific checks. Integrated acceptance
belongs to Flow after all steps finish; a phase run cannot close the change.
