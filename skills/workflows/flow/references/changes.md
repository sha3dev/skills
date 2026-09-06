# Project changes

Read this for a requested feature or revision after initial project completion,
or when the router reports an active change. Flow owns creation, planning,
state transitions, and final review; the user never manages files or commands.
Use `interview` for material decisions, with the change document as its artifact.

## Proposal

Before creating the first change, require `changeSupport: true` in the router's
`done` result. An older snapshot may silently ignore unknown command arguments;
report missing support before writing a proposal or invoking change commands.

Maintain one active change. Continue its scope when a request refines it; if the
request changes that scope, revise and reapprove the active proposal before
further implementation. Do not silently combine an unrelated request with
approved work. Bare `flow` resumes state and never invents a change.

Inspect the current web, API, worker, connection, architecture, and domain contracts together,
then the code and fixtures needed to assess the request. A project-wide review
does not require editing every app. Preserve the current contracts during
proposal preparation; record intended differences in
`.flow/changes/<slug>.md`. Keep the objective, affected responsibilities and
contracts, exclusions, acceptance criteria, material decisions, and approval
there. Reference current artifacts rather than copying them.

Prepare an ordered JSON array of steps in a temporary file. Each step is
`{"application":"<declared name>","phase":"<existing phase>"}`, or
`{"phase":"architecture-surface"}` / `{"phase":"domain-surface"}` for the project. Use only outcomes supported by
installed workflows; an unsupported implementation requires an explicit workflow
extension, not a surface marked complete as a substitute. Preserve fixtures and
infrastructure boundaries. Changes to the application inventory or relationship
schema need separately supported tooling; this cycle revises declared outcomes.

Choose order from the proposed change, not initial discovery order. Include
connection verification for every web whose own surface or API provider changes,
after those surfaces. Follow application changes with architecture review, then
domain reconciliation when those phases exist. Architecture-only changes also
require domain reconciliation. Retain valid infrastructure decisions and never
copy secret environment values into proposals or approval records. On revision, the step array is the remaining execution plan: include all
unfinished phases and completed phases affected by the revised scope, plus their
downstream reconciliation. Omit completed, unaffected phases. Retain their scope
and valid evidence in the change document, not as steps to execute again.

Register the proposal through the generated progress writer:

```bash
node .flow/tools/project-progress.mjs --root . --change <slug> --plan <temporary-json>
```

New IDs require completed initial work; an existing proposed change can replace
its plan. The tool owns structured state in `project.json`; never edit it by
hand. Keep closed change documents concise and retain them under their original
IDs. Current surface and domain documents remain the product's source of truth.

## Approval and execution

Present the concrete proposal and wait for explicit human approval. Finalize the
document before recording it; the tool fingerprints the document and ordered
steps so an edited proposal cannot start under stale approval.

```bash
node .flow/tools/project-progress.mjs --root . --change <slug> --set approved --approval "<actual user approval>"
node .flow/tools/project-progress.mjs --root . --change <slug> --set implementing
```

The second transition reopens planned phases atomically. Route again and run one
step at a time. Initial discovery prerequisites are replaced by the approved
order; phase-specific verification and approvals still apply. Give each worker
the change document reference so it implements agreed cross-application
contracts without inventing decisions or expanding its own scope. Update the
owning current contract as that step implements the approved change.

For a material scope change, or corrections discovered during final review,
return the same change to `proposed` with the progress writer, update its
document and plan, and obtain fresh approval. Preserve valid implementation and verification evidence;
reopened steps reconcile it rather than rebuild it.

## Integrated review

When every step is complete, verify the change's acceptance criteria across the
affected applications. Reuse valid phase evidence; run missing integration
checks. Reuse a passing full project gate while its inputs remain unchanged. A documentation-only change
uses document and reference review. Record concise evidence and limitations in
the change document, then enter review and present the integrated result:

```bash
node .flow/tools/project-progress.mjs --root . --change <slug> --set in-review
```

Do not confuse approval of the plan or one phase with final acceptance.

After explicit integrated acceptance, record it in the document and set
`complete`:

```bash
node .flow/tools/project-progress.mjs --root . --change <slug> --set complete --approval "<actual user acceptance>"
```

A later feature creates a new change; closed changes cannot be reopened. No runtime processes should
remain owned by the review after it ends.

Generated tools are project-owned snapshots. If change support is missing,
report that they need updating; never claim updating installed skills migrated
them or bypass the writer with manual state edits.
