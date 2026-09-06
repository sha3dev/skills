---
name: to-domain-surface
description: Review the minimal app/package ownership design after Flow architecture approval. Documentation only; no scaffolding or implementation.
disable-model-invocation: true
---

# To Domain Surface

Design the smallest codebase that covers the project's approved behavior
without duplicating business responsibilities. Decide what stays inside each
app and what belongs in reusable packages. Produce documentation for human
approval; write no implementation, scaffolding, or infrastructure.

## Entry

This is a project-wide phase. Read `.flow/domain/surface.md` when resuming,
then `.flow/project.json` and the approved `.flow/architecture/surface.md`. All
declared application phases and `architecture-surface` must be `complete`.
Require project-level `progress.domain-surface` and compatible generated tools;
report missing setup support rather than editing state by hand.

Start with:

```bash
node .flow/tools/project-progress.mjs --root . --project --phase domain-surface --set in-progress
```

For later revisions, follow Flow's active approved change and its reopened
project step. Direct requests enter that change cycle before editing.
Use `interview` for durable context and material decisions. Prepare the proposal
autonomously; ask only for information or choices that affect the design.

## Design

Read all approved web, API, and worker contracts, application relationships,
connection decisions, approved infrastructure uses and environment examples,
and relevant existing code and fixtures before assigning
owners. Compare behavior across the whole project, including app-local needs.
Fixtures illustrate scenarios; they do not define business rules. Surface
conflicts and missing rules instead of inventing them.

- Use the approved infrastructure as a constraint, not a package checklist.
  Do not redefine components or environment configuration here; return material
  architecture changes to Flow for review before continuing.
- Keep app-specific code local unless it has a clear independent use.
- Extract packages for shared responsibilities or credible future reuse, even
  with one current consumer. Justify each boundary by a concrete benefit.
- Give each shared responsibility one owner. Reuse existing code where it fits
  and identify duplicates to consolidate later. Similar-looking code does not
  necessarily represent the same rule.
- Prefer fewer modules, packages, layers, and abstractions. Add separation only
  when it earns its complexity; impose no predefined architecture.
- Keep dependencies explicit and acyclic. Packages do not depend on apps;
  domain rules remain independent of transport, fixtures, and infrastructure.
  Preserve runtime boundaries: shared code does not imply shared process state.

## Deliverable

Write concise technical English in `.flow/domain/surface.md`:

- Proposed app/module/package tree, responsibilities, consumers, and boundary
  rationale. Distinguish current consumers from anticipated reuse.
- Dependency map and internal contracts sufficient to review ownership.
- Traceability from web responsibilities, API operations, and worker processes to their owners and
  dependencies; identify behavior that needs no domain logic.
- Existing code to retain or consolidate, relevant fixture walkthroughs,
  source references, unresolved decisions, and approval state.

Reference existing contracts instead of duplicating them. Apply `interview`'s
durable-context rules, splitting detail only when useful. On resume or upstream
revision, reconcile changed sources while retaining valid decisions.

## Review and completion

Check full behavior coverage, single ownership of shared rules, dependency
direction, and package justification. Remove any separation that adds no value.
Validate the document's references and ensure changes contain only domain
documentation and workflow progress. Runtime tests, servers, and browser gates
from application workflows do not apply to this documentary phase.

Present the concrete proposal for human approval. Once approved, with no open
decision affecting ownership or coverage, record approval and run:

```bash
node .flow/tools/project-progress.mjs --root . --project --phase domain-surface --set complete
```

Completion approves the design; implementation is a later phase. Upstream
application revisions invalidate approval and require reconciliation.
