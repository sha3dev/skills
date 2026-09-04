# To API Surface

## What it does

`to-api-surface` turns confirmed consumer needs and an API responsibility into
an agreed HTTP contract and a runnable Fastify application. It maintains the
resumable functional specification at
`.flow/applications/<application-slug>/surface.md`, implements the contract
vertically, and exposes generated OpenAPI JSON from the route schemas.

Shared fixtures provide deterministic initial domain state through replaceable
repositories. Required writes operate in memory for the lifetime of the server
without changing those fixture files.

## When to reach for it

Invoke it after `setup` to specify, build, or resume an `api` application. When
the API has related web consumers, complete those web surfaces first so their
confirmed journeys and data needs can drive the contract. Invoke it on a
completed API surface only when explicitly revising it.

## Prerequisites

`setup` must have generated a valid `.flow/project.json` and toolchain, and the
application must declare an `api-surface` phase. Related incoming web surfaces
must be complete. The `interview`, `fixtures`, `typescript-stack`, and
`fastify-best-practices` toolkit skills must be available.

## It's working if

The functional decisions remain resumable from `surface.md`; route schemas
validate and serialize the confirmed contract; OpenAPI describes those same
operations; and tests exercise requests through Fastify's injection boundary.
The running server exposes each reviewed increment to an external HTTP client.
Reads begin from stable shared fixtures, required writes are observable during
the process, and restarting restores the initial data. The phase completes only
after whole-surface approval, passing workspace tests, complete generated
OpenAPI, and a green repository gate.

## Where it fits

`setup` defines the API and its relationships. Completed web surfaces provide
consumer requirements, `interview` resolves the API contract, `fixtures` owns
shared example records, and `fastify-best-practices` guides the framework-level
implementation. `connect-to-api` later replaces the web's local repository
with an HTTP adapter against this API without changing its domain components.
