# Flow

## What it does

`flow` reads the project's durable workflow state, chooses the appropriate
installed workflow, and runs it in a clean worker context when supported. The
main context retains only routing, product decisions, and the concise
user-facing result.

The choice itself is deterministic. A bundled script resolves the durable state
and a declarative rule table into a single decision: continue one workflow, ask
which application to continue, report that nothing is open, or report a
concrete blocker. The agent acts on that decision instead of inferring one from
skill descriptions or repository contents, so the same project state always
routes the same way. Supporting a new outcome is a rule change, not a prompt
change.

Work explicitly recorded as in progress is resumed before anything pending. An
open phase that no installed workflow can advance is reported as such rather
than retried, so a gap in the installed workflows is visible instead of silent.
Declarative routing prerequisites can also hold back a surface until related
applications provide the confirmed input it needs; an API consumed by a web
application therefore waits for that web surface to complete. The web's
connection phase then waits for its own surface and every outgoing API surface,
making surface design, API implementation, and integration distinct durable
outcomes.

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
tool noise entering its context. Identical project state produces an identical
route. The user receives only the context or product choice needed, without
seeing or invoking the internal route.

## Where it fits

`flow` is the user-facing entry point and orchestrator. The selected workflow
still owns its approvals, work, progress changes, and stopping rules. Workers
share its worktree and permissions; isolation applies only to model context.
