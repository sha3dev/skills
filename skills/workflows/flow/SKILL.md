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
   artifacts into this context.
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

The unit of delegation is one workflow run: one skill, one outcome, one
application. Its end is the only natural place to drop context. An interface
interview and its increments are worth nothing to the next application, and
carrying them there anchors new decisions on old ones.

Once the route is unambiguous, spawn exactly one worker for that run, with no
inherited conversation turns. Reuse that same worker for every user reply
inside the run. Never re-spawn it per question: that trades a warm context for
a re-read of the skill, its artifacts, and the code already written, on every
turn. If workers cannot stay alive across turns, run the workflow in this
context instead, under the same communication limits — repeated cold spawns
cost more than they isolate.

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
and re-read durable state.

Closing a worker ends that run's context, which is the point. Do not carry its
questions, answers, or intermediate results into the next routing decision;
re-read `PROJECT.md` and the relevant workflow artifacts instead. If state did
not advance, report the inconsistency and stop. Otherwise continue an
unambiguous next workflow in a fresh worker, or ask only for the product choice
needed to continue.

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
