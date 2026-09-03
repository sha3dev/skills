---
name: flow
description: Inspect durable project state, select the appropriate installed workflow, and run it in an isolated subagent when supported. Use explicitly without arguments to enter or continue a project.
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

Once the route is unambiguous, spawn exactly one execution subagent with no
inherited conversation turns (`fork_turns: "none"` when supported). Do not run
independent writers or permit nested delegation. Subagents share the worktree;
this is context isolation, not filesystem isolation.

Give the worker only:

- The repository root.
- The selected skill's identifier or `SKILL.md` location.
- The selected outcome or application.
- The latest relevant user reply, including referenced attachments, only when
  it is not durable yet.

Tell it to read the selected `SKILL.md` completely, derive all other context
from durable project artifacts, execute until that workflow's next stopping
condition, and return only:

- `status`: `needs-input`, `complete`, or `blocked`.
- `user_message`: the concise, standalone message the user needs next.

On `needs-input`, relay the message and reuse that worker for the user's reply.
On `blocked`, close it and relay the blocker. On `complete`, close it and route
again. If the new decision is identical to the one just executed, report the
inconsistency and stop. Otherwise act on it in a fresh worker. If clean
subagents are unavailable, execute the selected workflow locally with the same
context and communication limits.

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
