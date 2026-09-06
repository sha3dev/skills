# To Domain Surface

## What it does

`to-domain-surface` designs the smallest app and package architecture capable of
supporting approved web responsibilities, API operations, and worker processes without duplicating
business responsibilities. It considers the whole project before proposing
boundaries, deciding what stays app-local and what merits an independent
package. A concrete reusable capability can justify a package with one current
consumer; speculative generality cannot.

The result is reviewable documentation in `.flow/domain/surface.md`, with
optional thematic detail under `surface/`. It connects consumers to canonical
owners, explains package boundaries and dependencies, and identifies existing
code to preserve or consolidate in a later implementation phase.

## When to reach for it

Use it once application surfaces, connections, and infrastructure configuration
are approved through `to-architecture-surface`,
before implementing the domain and auxiliary packages. This is the point where
the complete set of consumers makes cross-application duplication visible.
Later code structure revisions are steps in Flow's approved project changes.

## Prerequisites

An initialized project with application and architecture phases complete, the project-level
`domain-surface` phase, and the `interview` toolkit skill. Existing projects need
project-aware generated state tools and the new project phase; updating installed
skills alone does not migrate `.flow/tools/` or `.flow/project.json`.

## It's working if

The operator can trace web responsibilities, API operations, and worker processes to its intended
owner, understand why each package exists, and approve the app/package split.
Shared rules have one planned source of truth, dependencies are acyclic, and
fixture walkthroughs support the design without being mistaken for business
requirements. The design stays minimal without forcing unrelated behavior into
shared abstractions.

Only documentation and progress change. No folders, package scaffolds, domain
logic, or infrastructure are implemented. Completion means code structure approval,
not proof that current runtime code has no duplication.

## Where it fits

`flow` routes this project-wide phase after the infrastructure and environment configuration approval in
`to-architecture-surface`.
`interview` preserves decisions and human review. Existing fixture-backed
applications continue working as before. Domain implementation and infrastructure
integration are later work. Application changes finish with domain reconciliation, retaining valid
architecture decisions. Phase approval remains distinct from acceptance of
the whole change.
