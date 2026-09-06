# Flow

## What it does

`flow` is the project's entry point for initial construction and later features
or revisions. It reads durable state and runs one workflow at a time, in a
clean persistent worker context when supported.

Initial construction follows the declared surface and connection dependencies,
then infrastructure/environment approval and the project-wide domain review. Subsequent work is a global change:
Flow evaluates affected contracts together, prepares an ordered proposal, and
obtains human approval before reopening its phases. The approved order replaces
initial discovery order, so an API revision can precede its web consumer.

Each change has one document at `.flow/changes/<slug>.md`. Structured state in
`project.json` tracks its steps and lifecycle: `proposed`, `approved`,
`implementing`, `in-review`, and `complete`. Only one change is active. Flow
creates and updates these artifacts; users describe the desired behavior and
approve the proposal and integrated result. They do not manage state commands.
Closed changes remain distinct records; current contracts describe the product.
Revised plans contain remaining or affected work, preserving valid completed
phases and their evidence. New planning rules do not reinterpret closed history.

Routing is deterministic. It continues the next approved step, returns control
to Flow for change planning or integrated review, asks about genuinely ambiguous
initial work, or reports completion or a concrete blocker. A bare invocation
resumes work without creating a change. Unsupported outcomes are reported rather
than treated as completed surfaces.

## When to reach for it

Use `flow` to start a project, resume unfinished work, or request a feature or
revision. Optional free-form context can describe priorities and what changed;
it does not replace durable state or establish approval.

A later request can affect several applications while implementation remains
sequential. A project-wide assessment does not require changing every app.

## Prerequisites

Install every workflow Flow may select and their toolkit prerequisites,
including `interview` for change decisions. Generated state tools must support
the change cycle; updating installed skills does not migrate project-owned
`.flow/tools/` snapshots. Initial construction must finish before the first
change opens. The current cycle revises declared workflow outcomes; extending
the application inventory or introducing unsupported implementation phases
requires corresponding tooling or workflows.

## It's working if

A feature has one approved scope, ordered execution, and integrated acceptance.
The router resumes it across sessions without circular initial-order blockers.
Required connection verification, architecture review, and domain reconciliation are included, and
phase approval cannot silently close the overall change. Later features retain
their own records. Users only need to invoke Flow and make product decisions.

## Where it fits

Flow coordinates the project; each selected workflow owns its implementation,
verification, processes, and phase approval. One worker runs one phase, reading
the active change and current contracts as needed. Workers share the worktree;
isolation applies to model context. Flow handles the final integrated review.

Older generated projects retain initial routing until their project-owned tools
are updated. Older state can omit project phases, but current domain work requires an
approved architecture phase. Flow reports the missing prerequisite before
delegation; adopting it requires a reviewed project-tool and state migration. Updated skills alone do not add these phases or
replace generated tools.
