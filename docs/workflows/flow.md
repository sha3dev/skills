# Flow

## What it does

`flow` reads the project's durable workflow state, chooses the appropriate
installed workflow, and runs it in a clean subagent context when supported. The
main context retains only routing, product decisions, and the concise
user-facing result.

One worker covers one workflow run — one skill, one outcome, one application —
and stays alive for its whole duration, so an interview continues across turns
without re-reading the skill, its artifacts, or the code already written. That
run's end is the point of the isolation: the worker closes, its context goes
with it, and the next application starts from durable artifacts rather than
from the previous one's decisions. Project artifacts, not agent context, remain
the source of truth.

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
