# Flow

## What it does

`flow` reads the project's durable workflow state, chooses the appropriate
installed workflow, and runs it. Decisions and questions stay in the main
conversation; the workflow's tool-heavy segments run in clean subagents that
return only what the user needs to read.

Isolation is spent where it pays. A relayed question and its answer land in the
main context either way, so isolating an interview would cost one worker per
question and save nothing. Installation, generated code, repository checks,
builds, and browser inspection are the opposite shape, so each of those
segments gets its own worker. When a workflow's outcome completes, `flow` reads
durable state again and routes onward. Project artifacts, not agent context,
remain the source of truth.

The internal skill names are not part of the user journey. Knowing and invoking
`flow` is sufficient.

## When to reach for it

Invoke `flow` without arguments whenever the next step is unclear, including
when returning to a project after time away or finishing a workflow stage.

## It's working if

The correct workflow continues immediately without unrelated conversation or
tool noise entering its context. The user receives only the context or product
choice needed, without seeing or invoking the internal route.

## Where it fits

`flow` is the user-facing entry point and orchestrator. The selected workflow
still owns its approvals, work, progress changes, and stopping rules. Subagents
share its worktree and permissions; isolation applies only to model context.
