---
name: connect-to-api
description: Connect an application's completed surface to its completed API dependencies by replacing local fixture-backed data access with HTTP adapters and verifying the integrated behavior. Currently applies to declared web-to-API relationships.
disable-model-invocation: true
argument-hint: "[web application]"
---

# Connect to API

Connect an application to its declared outgoing API relationships. The current
workflow route supports a selected `web` application; do not infer support for
other application types until their surface workflows define the required
boundary. Preserve the approved consumer and API surfaces while replacing the
consumer's local fixture-backed composition with real HTTP calls. The APIs remain
backed by the shared records under `.flow/fixtures/`; the web must no longer
load those records at runtime. `.flow/project.json` is the sole progress
tracker. Do not create another specification artifact for this phase.

## Workflow

1. Run `node .flow/tools/repo-state.mjs --root . --expect already_initialized`
   and stop on failure. Use its `applications` to select the named `web`
   application with an open `api-connection` phase, or ask the user when the
   choice is ambiguous. Then apply `$workflow-run`'s entry check.
2. Read the relevant `.flow/project.json` application and relationship entries.
   Select every outgoing relationship from this web application to an `api`
   application. Require the web's `web-surface` and every related API's
   `api-surface` to be `complete`; stop with the precise unfinished phase if any
   prerequisite is not satisfied. An absent API relationship or
   `api-connection` phase is an invalid route, not work to infer.
3. Read the web and related API `surface.md` files, their implementations, the
   generated OpenAPI documents or route schemas, and only the fixture
   collections needed to understand their mappings. Treat both confirmed
   surfaces as fixed contracts. Correct technical integration defects that fit
   those contracts, but stop and request a surface revision when connecting
   them would require a new product behavior, endpoint, representation, or
   fixture scenario.
4. If `api-connection` is `pending`, change it to `in-progress` with
   `node .flow/tools/project-progress.mjs --root . --app <name> --phase api-connection --set in-progress`.
5. Preserve the web's production-facing domain types, repository interfaces,
   components, and interaction semantics. Implement one HTTP repository adapter
   per API responsibility and replace the local adapter only at the composition
   boundary. Map transport representations at the HTTP boundary; do not leak
   response envelopes or API-only fields into components that do not need them.
6. Give each related API a Vite variable named
   `VITE_<API_SLUG_WITH_UNDERSCORES>_BASE_URL`, and document it with the API's
   fixed local URL in the web workspace's committed `.env.example`. Supply
   those variables when running and building the web locally; do not embed
   environment-specific production URLs in source. Fail visibly on a missing
   or invalid value instead of silently using fixture data.
7. When browser and API origins differ, configure each API to allow the fixed
   local origins of every declared web application that consumes it, not only
   the web selected for this run. Preserve any other explicit origins already
   configured. Add the root-pinned `@fastify/cors` version to that API workspace
   and apply `$fastify-best-practices`, reading its CORS guidance. Keep the
   allowed origins explicit and environment-configurable, and document new
   configuration in that API workspace's `.env.example`. Follow an established
   configuration name when one exists; otherwise use `ALLOWED_WEB_ORIGINS` for
   a comma-separated list. Never enable a wildcard merely to make development
   pass. Do not otherwise restructure or extend the API.
8. Remove the web's local fixture adapter and direct fixture imports when they
   are no longer used. Do not copy fixtures into application source, keep a
   hidden fixture fallback, change `.flow/fixtures/`, introduce `Mock`-prefixed
   application names, or add persistence or infrastructure.
9. Run the web and every related API at their fixed URLs under
   `$workflow-run`'s development process rules. Exercise each
   changed API operation as an external HTTP client, including CORS where it
   applies. Then use available browser tooling at representative desktop and
   mobile widths to verify that reads, confirmed writes, loading, empty, and
   error behavior still match the web surface through real HTTP. If browser
   tooling is unavailable, state that integrated browser verification is
   pending and do not complete the phase.
10. Run affected workspace tests and `npm run check:code` while integrating.
    Before completion, require related API tests, successful production builds
    for the web and related APIs where they define a build, and a green full
    `npm run check`. Confirm from the built web inputs or network behavior that
    it no longer consumes `.flow/fixtures/` directly. Then run
    `node .flow/tools/project-progress.mjs --root . --app <name> --phase api-connection --set complete`.

## Run discipline

Apply `$workflow-run` for the entry check, development process ownership,
revising a completed connection, and the run boundary. This run is one `web`
application and all of its declared API dependencies: it starts at step 1 and
ends at step 10 or at a blocker, and its inputs are durable in
`.flow/project.json`, the confirmed surface specifications, OpenAPI or route
schemas, and application code; no interview context carries into it. Do not
begin a surface revision inside this run. Beyond an explicitly requested
reopen, the progress tool also returns a completed connection to `pending` when
its web surface or any related API surface is reopened.
