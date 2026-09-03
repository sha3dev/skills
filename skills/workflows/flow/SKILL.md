---
name: flow
description: Inspect durable project state, select the appropriate installed workflow, and run it in an isolated subagent when supported. Use explicitly without arguments to enter or continue a project.
disable-model-invocation: true
---

# Flow

Enter or continue the project's workflow. The skill takes no arguments.

## Route

1. Establish the current state from the cheapest durable source. When
   `.agents/tools/repo-state.mjs` exists, run it with `--root .` and read only
   the relevant parts of `PROJECT.md`. Otherwise, inspect only enough top-level
   repository state to distinguish an eligible new project, an initialized
   project, and an unsupported or invalid state. Prefer durable evidence over
   conversation and do not ask for discoverable context. Treat a failed state
   check as invalid state; do not route by guessing.
2. Resume explicitly recorded `in-progress` work first. Otherwise choose an
   eligible `pending` outcome. Treat outcomes with the same status as equal
   unless the canonical state or an exposed workflow description defines an
   order or prerequisite. Never infer `complete` from artifacts, code, or
   checks when the canonical progress source does not record it.
3. Match that outcome to an installed workflow skill using exposed descriptions.
   Exclude this orchestrator. Do not load the selected `SKILL.md` or its working
   artifacts into the main context.
4. If several outcomes have equal priority, use clear conversation context to
   disambiguate. Otherwise state the minimum useful context, recommend one only
   when evidence supports it, and ask for the product choice needed to route.
   Ask nothing when the route is unambiguous.

When durable project state is absent, route to initialization only if top-level
evidence suggests the repository may be eligible; that workflow owns the exact
readiness check. In an initialized repository, resume active work before
starting another available surface or stage. If no installed workflow can advance
the selected outcome, state the concrete blocker instead of inventing a
workflow.

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
On `blocked`, close it and relay the blocker. On `complete`, close it and
re-read durable state. If state did not advance, report the inconsistency and
stop. Otherwise continue an unambiguous next workflow in a fresh worker, or ask
only for the product choice needed to continue. If clean subagents are
unavailable, execute the selected workflow locally with the same context and
communication limits.

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
