---
name: flow
description: Resume a Flow project from durable state or manage a requested project-wide change, including its approvals and workflow routing.
disable-model-invocation: true
---

# Flow

Enter or continue the project's workflow, optionally followed by free-form
context: `$flow [context]`. With no context, route normally.

## Optional context

The user may describe what has been refined, what remains unfinished, or where
to focus next. For example: `$flow We have refined the home page header, but
the rest of the web surface is unfinished. Continue with the remaining pages.`

Pass relevant context to the selected workflow as user guidance, including in
the current-context fallback. Use it to preserve existing refinements and guide
the next work within that workflow's scope. Reconcile reported progress with
durable artifacts and the implementation; a partial-work summary is not proof
of phase completion or an instruction to reopen completed work. Context may
resolve a `choose` decision, but must not override a `run`, `done`, or `blocked`
decision. Requests for subsequent features or revisions follow the change cycle below.

## Project evolution

Initial construction follows the ordinary route. Once it is complete, a new
feature or revision is one project-wide change, potentially spanning several
applications. Flow creates and maintains that change automatically from the
user's request; users provide intent and approvals, not state commands.

For a new change or an active one, read [Project changes](references/changes.md).
Prepare and agree its scope before reopening phases. Keep one active change;
its approved order replaces initial discovery prerequisites. Bare `flow` only
resumes existing work. During initial construction, refine the current phase;
explicit revisions of an already approved phase may still use its progress
command with `--reopen` while initial work remains open.

## Route

Run the bundled `scripts/route.mjs` with `--root .`, resolving it relative to
this `SKILL.md`. It reads the project's durable state, applies `routes.json`,
and prints one JSON `decision`. That decision is the route. Never override it
from conversation, artifacts, code, or checks, and never route by inspecting
the repository yourself.

- `run` — continue with `skill` for the reported `application` and `phase`,
  or the whole project when `scope` is `project`.
- `choose` — the open work is genuinely ambiguous. Answer from unambiguous
  conversation context when it exists; otherwise state the minimum useful
  context and ask which application to continue, in product terms. Then
  continue with that candidate's `skill`.
- `change` — continue proposal, execution preparation, or integrated review
  under [Project changes](references/changes.md), in the main context.
- `done` — no phase or change is open. If the user requested new work, prepare
  its change; otherwise say so and stop.
- `blocked` — report the concrete blocker from `reason` with `detail`, `state`,
  `unroutable`, or `waiting`. Never invent a workflow to work around it.

A non-empty `unroutable` list is not itself a blocker while a route exists;
mention it only when the user needs to know that some work has no installed
workflow. A `skillStatus` of `unverified` means the installation layout could
not be confirmed, not that the workflow is missing; proceed, and treat an actual
load failure as a blocker.

When using a clean worker, do not load the selected `SKILL.md` or its
working artifacts into the main context. Current-context execution is the exception:
running the workflow here requires reading its `SKILL.md` completely.
Supporting another outcome means adding a rule to `routes.json`, not new prose
here.

## Execute

When clean, persistent workers are available and delegation is authorized, read
[Delegation](references/delegation.md) and use one worker per workflow run.
Otherwise load the selected skill and execute in the current context. Preserve
its stopping rules and reroute after completion. If routing returns the same
completed step, report the inconsistency instead of looping.

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
