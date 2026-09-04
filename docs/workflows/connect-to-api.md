# Connect to API

## What it does

`connect-to-api` connects an application's completed surface to its completed
API dependencies by replacing local fixture-backed repositories with HTTP
adapters. Its current route supports web applications: the APIs continue to
initialize their in-memory repositories from the shared fixtures, while the
browser no longer loads those files.

The workflow preserves the approved surface contracts, configures the required
base URLs and cross-origin boundary, and verifies the integrated behavior with
the applications running together. `.flow/project.json` records the connection
as `pending`, `in-progress`, or `complete`.

## When to reach for it

Use it after both sides of a declared `web` to `api` relationship have complete
surfaces. It is not a surface-design workflow and does not add endpoints,
interface behavior, fixture scenarios, persistence, or deployment
infrastructure.

## Prerequisites

`setup` must have created the web application's `api-connection` phase. Its
`web-surface` and every related `api-surface` must be complete. The
`typescript-stack` and `fastify-best-practices` toolkit skills must be
available.

## It's working if

The web preserves its domain-facing repository contracts and visible behavior
while its network requests reach the declared APIs. API-only fields remain at
the transport boundary, CORS preserves every declared web consumer origin for
shared APIs, shared fixtures are loaded only by API repositories, and the
integrated browser flow, tests, builds, and repository gate pass. Reopening
either surface returns the connection to `pending` so stale integration is
never reported as complete.

## Where it fits

`setup` derives connection work from application relationships.
`to-web-surface` first builds an HTTP-ready disconnected interface, and
`to-api-surface` builds the fixture-backed HTTP contract from its confirmed
needs. `flow` then selects `connect-to-api` to replace the web's local
adapter and verify both surfaces together.
