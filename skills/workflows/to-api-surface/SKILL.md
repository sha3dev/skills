---
name: to-api-surface
description: Specify, build, or resume one initialized API application's HTTP surface through a persistent contract interview, a domain-specific visual review surface, and runnable incremental Fastify implementation.
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
The application serves an ad hoc API review interface at its fixed URL. That
interface is designed for the API's domain but reads operations and technical
details from the generated OpenAPI document rather than duplicating them.

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
   artifact, and `$rest-api-design` to shape the HTTP form of each confirmed
   decision. Its subject-specific lens is the API's consumers and use cases,
   resources, operations, methods and paths, request parameters and bodies,
   response representations, status codes, errors, state transitions,
   filtering, ordering, pagination, concurrency, and security expectations.
   Start from confirmed consumer needs but include API-only fields and
   operations when the API responsibility requires them. Record required
   domain entities and meaningful data states without duplicating concrete
   fixture records. Also establish who reviews the API and which overview,
   grouping, lifecycle, or relationship views will make its shape easy for
   that audience to scan. Follow only relevant branches, write technical prose
   in English, and do not design persistence, real authentication, or external
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
   handwritten machine contract.
6. Treat the generated API reference as a review surface, not generic framework
   documentation. Apply `$frontend-design` to give it a restrained visual and
   information architecture specific to the API's domain, audience, and
   responsibility. Compose it as a continuous, document-like contract: begin
   with a compact map of resources, methods, paths, reads, and mutations, then
   show every operation with its relevant purpose, parameters, request bodies,
   responses, errors, examples, state transitions, and relationships already
   expanded. A reviewer must be able to read nearly the whole contract by
   scrolling or print it to a coherent PDF; never require clicks, tabs,
   accordions, or selection to reveal contract information. Anchor links and
   print controls may aid navigation without hiding content. Adapt the document
   when the contract calls for a matrix, lifecycle, resource map, or another
   clearer domain view; do not reproduce a generic Swagger-style list.
7. Read paths, methods, parameters, schemas, response codes, and examples at
   runtime from `/openapi.json`. Never hardcode those contract facts into the
   reference interface or maintain a parallel endpoint catalog. Domain-specific
   labels, ordering, explanatory context, and visual composition may live in
   the interface when they improve review, but they must not claim behavior
   absent from OpenAPI. Keep this review surface inside the API workspace and
   on the same Fastify server; do not create another application or service.
8. Use `$fixtures` to create or extend shared records under `.flow/fixtures/`.
   Access them through production-facing repository interfaces. Treat fixture
   files as immutable initial state: repositories clone the relevant records
   into memory when the application is built. Implement only the writes the
   confirmed surface requires, make their effects observable to later requests
   in that server process, and reset them on restart. Handlers and domain logic
   must not import fixtures directly. Do not add a database, write back to
   fixture files, or introduce `Mock`-prefixed application names.
9. Implement one small vertical increment at a time. Serve this application
   from its watch process at the fixed URL reported by the initializer, under
   `$workflow-run`'s development process rules. Evolve the review surface with
   the contract so each increment is visible at that same URL.
10. After an increment that changes `.flow/fixtures/`, apply `$fixtures`'
   validation procedure. After every increment, run the workspace tests and
   `npm run check:code`. Tests use Fastify injection and assert the observable
   HTTP contract, including meaningful error and mutation behavior; do not test
   handlers directly. Exercise the changed operation against the running server
   as an external HTTP client and inspect the generated OpenAPI JSON. Use
   the browser automation established by `$workflow-run` to inspect the review
   surface at representative desktop and mobile widths and verify that the
   entire changed contract is visible without interaction. Also inspect its
   print layout or produce a temporary PDF to catch clipping, hidden content,
   and poor page breaks. Adjust it to reach the same review threshold as a
   web-surface increment, then give the user its fixed URL. Use `$interview`
   again when review reveals a product decision, and record it in `surface.md`
   before changing code.
11. Complete `api-surface` under `$workflow-run`'s completion rule. What the
   user approves is the whole API surface. Its phase-specific preconditions are
   passing workspace tests, a generated OpenAPI that describes every confirmed
   operation, and a review surface that presents the whole contract without a
   parallel hardcoded catalog. Then run
   `node .flow/tools/project-progress.mjs --root . --app <name> --phase api-surface --set complete`.

## Run discipline

Apply `$workflow-run` for the entry check, development process ownership,
completing a phase, revising an approved surface, and the run boundary. This
run is one `api` application's surface: it starts at step 1 and ends at step 11
or at a blocker, and it resumes from `.flow/project.json`, the related
completed surfaces, and the API's `surface.md`.
