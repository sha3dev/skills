---
name: flow
description: Inspect durable project state, select the appropriate installed workflow, and run it while isolating its tool-heavy segments in subagents. Use explicitly without arguments to enter or continue a project.
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
   Exclude this orchestrator.
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

Isolation is not free. Every worker costs a spawn and a full re-read of durable
state, so spend it only where it removes context this conversation would
otherwise carry.

Relayed questions and user replies land here either way, so isolating an
interactive segment removes almost nothing and charges a worker for every
answer. Isolate the opposite shape: segments that produce heavy tool output —
installation, generated code, repository checks, builds, browser inspection —
and need no user reply until they finish.

So run the selected workflow in this context. Read its `SKILL.md` completely
and follow it, including its approvals, scope, and stopping rules. Delegate the
segments it marks as isolated, one worker per segment, with no inherited
conversation turns.

Give each worker only:

- The repository root.
- The selected `SKILL.md` location and the marked segment.
- The selected outcome or application, and the durable artifacts it must read.
- The single objective for this segment.

Tell it to derive every other fact from durable project artifacts, execute the
segment until its stopping condition, and return only:

- `status`: `complete` or `blocked`.
- `user_message`: the concise, standalone message the user needs next.

Never delegate a segment that must ask the user something. A worker that
reaches an unsettled product decision returns `blocked` naming that decision;
resolve it here and delegate a fresh worker. Do not run independent writers or
permit nested delegation. Workers share the worktree; this is context
isolation, not filesystem isolation.

After each worker, re-read the durable artifacts it was told to write. If they
did not advance, report the inconsistency and stop. Otherwise relay
`user_message` and continue the workflow here. When the workflow reports its
outcome complete, re-read durable state and route again: continue an
unambiguous next workflow, or ask only for the product choice needed to
continue. If clean subagents are unavailable, execute the marked segments here
under the same context and communication limits.

## Boundaries

Skill selection is internal. Never ask the user to know, choose, or invoke a
skill by name. Mention one only when a missing or broken installation makes the
name actionable.

The `$flow` invocation authorizes routing into the selected workflow, but does
not bypass that workflow's approvals, prerequisites, scope, or stopping rules.

## Communicate

Use the fewest words that make the current state, immediate objective, and any
required decision clear. Do not send a separate routing report: combine useful
context with the workflow's first action or question. Relay `user_message`
without adding routing details.

Write naturally; do not force a template. Normally use at most three short
sentences. Remove history, evidence inventories, procedural walkthroughs,
generic advice, and rationale that does not change the decision. Expand only
for a blocker, material risk, or an explicit request for detail.

Do not narrate routine inspection, routing, delegation, or skill loading. Keep
this rule active throughout the selected workflow, except where its required
artifact, warning, result, or approval needs more detail.
