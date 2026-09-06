# To Architecture Surface

## What it does

Defines the infrastructure the project will use and each component's broad
purpose. Its approval deliverable is the environment configuration: documented
variables, known values, and explicitly pending values. A short architecture
record supplies context; environment examples hold the configuration contract.
Sensitive values stay in local ignored files, outside review documents.

## When to reach for it

After application surfaces and connections are approved, before designing domain
and package boundaries. The interview resolves missing decisions from actual
functional needs, one question at a time, without requiring extra services.

## It's working if

The human can approve which components are needed, their uses, and how they will
be configured. Missing values are visible without exposing credentials. Pending
credentials can be explicitly accepted; architectural decisions are settled.
Fixtures still work and no service has been provisioned or connected.

## Where it fits

`flow` routes surfaces and connections, then `to-architecture-surface`, then
`to-domain-surface`. `interview` preserves decisions in
`.flow/architecture/surface.md`. Domain owns app/package structure and uses the
approved architecture as input. Later changes reconcile architecture before
domain. Existing projects need updated generated tools and phase state;
updating installed skills alone does not migrate them.
