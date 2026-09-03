# Flow

## What it does

`flow` reads the project's durable workflow state, chooses the appropriate
installed workflow, and runs it in a clean subagent context when supported. The
main context retains only routing, product decisions, and the concise
user-facing result.

One worker remains active for the duration of a workflow so an interview can
continue across turns. On completion, `flow` reads durable state again and
continues an unambiguous next workflow in a fresh worker. Project artifacts,
not agent context, remain the source of truth.

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
