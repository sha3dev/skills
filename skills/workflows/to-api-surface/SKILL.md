---
name: to-api-surface
description: Specify, build, or resume one initialized API application's HTTP surface through a persistent contract interview and runnable incremental Fastify implementation.
disable-model-invocation: true
argument-hint: "[API application]"
---

# To API Surface

Create only the selected application's Fastify HTTP interface inside
`<application.path>/`, with application source under `src/`. Maintain its
durable specification at `.flow/applications/<application-slug>/surface.md`,
where `<application-slug>` is the final directory in `<application.path>`. It
records the agreed functional contract, while route schemas are the executable
technical contract and `.flow/project.json` remains the sole progress tracker.

## Workflow

1. Run `node .flow/tools/repo-state.mjs --root . --expect already_initialized`
   and stop on failure. Use its `applications` to select the named `api`
   application, or ask the user when the choice is ambiguous. Then apply
   `$workflow-run`'s entry check.
2. Read the relevant `.flow/project.json` definition, terms, application, and
   relationship entries. For every incoming relationship from a `web`
   application, require its `web-surface` to be `complete`; otherwise stop and
   name the unfinished consumer. Read each completed consumer's `surface.md`,
   implementation, and relevant shared fixtures before defining the API. Read
   the API's own `surface.md` first when it exists, then inspect
   `<application.path>/src/` when implementation already exists. Create
   `surface.md` if absent, seeded only with facts from those sources and the
   user's request. If `api-surface` is `pending`, change it to `in-progress`
   with `node .flow/tools/project-progress.mjs --root . --app <name> --phase api-surface --set in-progress`.
3. Use `$interview` before implementation, with `surface.md` as its durable
   artifact. Its subject-specific lens is the API's consumers and use cases,
   resources, operations, methods and paths, request parameters and bodies,
   response representations, status codes, errors, state transitions,
   filtering, ordering, pagination, concurrency, and security expectations.
   Start from confirmed consumer needs but include API-only fields and
   operations when the API responsibility requires them. Record required
   domain entities and meaningful data states without duplicating concrete
   fixture records. Follow only relevant branches, write technical prose in
   English, and do not design persistence, real authentication, or external
   integrations.
4. The interview is complete when an implementer could build the HTTP contract
   without inventing a product decision. Mark `surface.md` as awaiting
   confirmation and present it. After the user confirms it, record that status
   before writing application code.
5. If the workspace does not exist, run the bundled
   `scripts/initialize-api-application.mjs --root . --app <name>` relative to
   this `SKILL.md`, then `npm install`. Apply `$fastify-best-practices` to the
   implementation and read only the rule files relevant to the current
   increment. Keep application construction separate from server startup,
   and define request and response schemas for every product route. Generate
   and expose OpenAPI JSON from those same schemas; do not maintain a second
   handwritten machine contract or add a documentation UI.
6. Use `$fixtures` to create or extend shared records under `.flow/fixtures/`.
   Access them through production-facing repository interfaces. Treat fixture
   files as immutable initial state: repositories clone the relevant records
   into memory when the application is built. Implement only the writes the
   confirmed surface requires, make their effects observable to later requests
   in that server process, and reset them on restart. Handlers and domain logic
   must not import fixtures directly. Do not add a database, write back to
   fixture files, or introduce `Mock`-prefixed application names.
7. Implement one small vertical increment at a time. Serve this application
   from its watch process at the fixed URL reported by the initializer, under
   `$workflow-run`'s development process rules.
8. After an increment that changes `.flow/fixtures/`, apply `$fixtures`'
   validation procedure. After every increment, run the workspace tests and
   `npm run check:code`. Tests use Fastify injection and assert the observable
   HTTP contract, including meaningful error and mutation behavior; do not test
   handlers directly. Exercise the changed operation against the running server
   as an external HTTP client and inspect the generated OpenAPI JSON. Present
   concise request and response examples for review. Use `$interview` again
   when review reveals a product decision, and record it in `surface.md` before
   changing code.
9. Only after the user explicitly approves the whole API surface, its workspace
   tests pass, the generated OpenAPI describes every confirmed operation, and
   the full `npm run check` passes, run
   `node .flow/tools/project-progress.mjs --root . --app <name> --phase api-surface --set complete`.
   Stop the development server and stop without starting another phase.

## Run discipline

Apply `$workflow-run` for the entry check, development process ownership,
revising an approved surface, and the run boundary. This run is one `api`
application's surface: it starts at step 1 and ends at step 9 or at a blocker,
and it resumes from `.flow/project.json`, the related completed surfaces, and
the API's `surface.md`.
