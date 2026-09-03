---
name: flow
description: Inspect durable project state, select the appropriate installed workflow, and run it in an isolated worker context when supported. Use explicitly without arguments to enter or continue a project.
disable-model-invocation: true
---

# Flow

Enter or continue the project's workflow. The skill takes no arguments.

## Route

Run the bundled `scripts/route.mjs` with `--root .`, resolving it relative to
this `SKILL.md`. It reads the project's durable state, applies `routes.json`,
and prints one JSON `decision`. That decision is the route. Never override it
from conversation, artifacts, code, or checks, and never route by inspecting
the repository yourself.

- `run` — continue with `skill` for the reported `application` and `phase`.
- `choose` — the open work is genuinely ambiguous. Answer from unambiguous
  conversation context when it exists; otherwise state the minimum useful
  context and ask which application to continue, in product terms. Then
  continue with that candidate's `skill`.
- `done` — no phase is open. Say so and stop.
- `blocked` — report the concrete blocker from `reason` with `detail`, `state`,
  or `unroutable`. Never invent a workflow to work around it.

A non-empty `unroutable` list is not itself a blocker while a route exists;
mention it only when the user needs to know that some work has no installed
workflow. A `skillStatus` of `unverified` means the installation layout could
not be confirmed, not that the workflow is missing; proceed, and treat an actual
load failure as a blocker.

Do not load the selected `SKILL.md` or its working artifacts into the main
context. Supporting another outcome means adding a rule to `routes.json`, not
new prose here.

## Delegate

The unit of delegation is one workflow run: one skill, one outcome, one
application. Its end is the only natural place to drop context. An interface
interview and its increments are worth nothing to the next application, and
carrying them there anchors new decisions on old ones.

Once the route is unambiguous, spawn exactly one worker for that run. It must
start from an empty context: inherit no conversation turns, and receive only
the values listed below. If the delegation mechanism can only fork the current
context, it is not clean; treat it as unavailable. Reuse that same worker for
every user reply inside the run. Never re-spawn it per question: that trades a
warm context for a re-read of the skill, its artifacts, and the code already
written, on every turn. If no clean worker is available, or workers cannot stay
alive across turns, run the workflow in this context instead, under the same
communication limits — repeated cold spawns cost more than they isolate.

Background processes a worker starts, such as a development server, belong to
that worker and outlive it. Require it to stop them before returning `complete`
or `blocked`, and to leave them running on `needs-input` because that worker
continues.

Give the worker only:

- The repository root.
- The selected skill's identifier or `SKILL.md` location.
- The selected outcome or application.
- The latest relevant user reply, including referenced attachments, only when
  it is not durable yet.

Tell it to read the selected `SKILL.md` completely, derive every other fact
from durable project artifacts, execute until that workflow's next stopping
condition, and return only:

- `status`: `needs-input`, `complete`, or `blocked`.
- `user_message`: the concise, standalone message the user needs next.

On `needs-input`, relay the message and send the user's reply back to the same
worker. On `blocked`, close it and relay the blocker. On `complete`, close it
and route again.

Closing a worker ends that run's context, which is the point. Do not carry its
questions, answers, or intermediate results into the next routing decision; let
`route.mjs` and the durable artifacts produce it. If the new decision is
identical to the one just executed, report the inconsistency and stop.
Otherwise act on it in a fresh worker.

Do not run independent writers or permit nested delegation. Workers share the
worktree; this is context isolation, not filesystem isolation.

## Boundaries

Skill selection is internal. Never ask the user to know, choose, or invoke a
skill by name. Mention one only when a missing or broken installation makes the
name actionable.

The `$flow` invocation authorizes routing into the selected workflow, but does
not bypass that workflow's approvals, prerequisites, scope, or stopping rules.

## Communicate

Use the fewest words that make the current state, immediate objective, and any
required decision clear. Do not send a separate routing report: combine useful
context with the worker's first action or question. Relay `user_message`
without adding routing details.

Write naturally; do not force a template. Normally use at most three short
sentences. Remove history, evidence inventories, procedural walkthroughs,
generic advice, and rationale that does not change the decision. Expand only
for a blocker, material risk, or an explicit request for detail.

Do not narrate routine inspection, routing, delegation, or skill loading. Keep
this rule active throughout the delegated workflow, except where its required
artifact, warning, result, or approval needs more detail.
