# sha3dev-skills

## 0.12.0

### Added

- Include AJ Geddes' `rest-api-design` skill as an automatically selected
  toolkit skill for shaping resource names, methods, representations, status
  codes, and collection conventions, and apply it while `to-api-surface`
  interviews the contract. Its Express.js example, handwritten OpenAPI
  template, validation script stub, and authentication and rate-limiting
  guidance are omitted as incompatible with the fixed Fastify platform and
  with the surface workflow's scope.

### Changed

- Require an explicit user approval before any phase reaches `complete`, and
  state that gate once in `workflow-run` instead of in each workflow.
  `connect-to-api` no longer completes `api-connection` on green checks alone.
- Accept `--root` in `verify-toolchain.mjs` instead of always inspecting the
  current working directory, matching every other generated tool, and run
  `check:toolchain` with `--root .` like the sibling check scripts.
- Drop `typecheck.dependsOn: ["^typecheck"]` from the generated `turbo.json`.
  With `noEmit` and no project references there is no build output to wait for,
  so the dependency only serialized the graph.
- Verify the dependency versions declared in `package.json` against the
  toolchain policy, not only the installed ones, so a range or a downgraded pin
  fails `check:toolchain` before `npm install` can hide it.

## 0.11.0

### Added

- Add the explicit `connect-to-api` workflow and durable `api-connection`
  phase for replacing a completed web surface's local fixture repository with
  HTTP adapters to its completed API surfaces.

- Add `@fastify/cors` to the fixed platform for browser-to-API connections,
  preserving every declared consumer origin for shared APIs while delegating
  framework implementation to the imported Fastify guidance.

### Changed

- Route web-to-API connection only after the web surface and all related API
  surfaces are complete. Reopening either endpoint automatically returns the
  connection to `pending`.

- Assign deterministic, distinct development ports to multiple web and API
  applications so related surfaces can run together during integration.

- Make disconnected web repository operations asynchronous when they may later
  cross an application boundary, preserving consumers when the HTTP adapter is
  introduced.

## 0.10.0

### Added

- Add the explicit `to-api-surface` workflow for interviewing and implementing
  a runnable Fastify API from confirmed consumer needs. Route schemas generate
  the exposed OpenAPI contract, and HTTP behavior is verified through Fastify
  injection and a live server.

- Include Matteo Collina's `fastify-best-practices` skill unchanged under its
  MIT license as an automatically selected toolkit skill.

- Add an API workspace initializer and extend the setup smoke test through the
  web-to-API routing and workspace initialization sequence.

### Changed

- Route API surfaces only after related incoming web surfaces are complete, so
  the API contract starts from confirmed consumer journeys and data needs.

- Define fixture files as immutable runtime seed data. Web and API surfaces
  implement only required writes in memory, where they remain observable until
  page reload or server restart without modifying shared fixtures.

- Add `@fastify/swagger` to the fixed platform so API route schemas can produce
  one generated OpenAPI document without a separate handwritten contract.

## 0.9.0

### Added

- Add the model-invoked `fixtures` toolkit skill and reserve
  `.flow/fixtures/` for deterministic domain records that disconnected
  application surfaces reuse and extend.

- Install a fixture validator in generated repositories and include it in the
  complete repository gate. Fixture collections use kebab-case JSON files with
  stable, unique string identifiers.

### Changed

- Make `to-web-surface` record data scenarios in its specification, evolve the
  shared fixtures during implementation, and keep them behind a replaceable
  data-access boundary. Application domain types and repositories use their
  production-facing names rather than mock-prefixed alternatives.

- Require shared fixtures to contain only fictional, non-sensitive values that
  are safe for client-side exposure.

## 0.8.0

### Added

- Add one end-to-end setup smoke test and run it in CI. The test initializes a
  generated repository, installs it, checks it, initializes its web application,
  and builds it.

### Changed

- Keep durable workflow state and its project-owned tools together under
  `.flow/`: the project contract is `.flow/project.json`, and application
  specifications use `.flow/applications/<application-slug>/surface.md`.

- Replace the generated Markdown project contract with structured JSON so
  project values cannot break parsing and progress updates do not depend on
  document formatting.

- Make the toolchain policy the only dependency-version source. Root development
  dependencies are no longer duplicated, and generated Biome and Knip schemas
  both derive their versions from the policy.

- Make each declared `apps/<app>/` path the application workspace and reserve
  its `src/` directory for application source. Keep `surface` as workflow and
  phase terminology instead of also using it as the workspace directory name.
  Opaque JavaScript assets now belong under `apps/<app>/public/`. Application
  workspace names use `@apps/<slug>` and reusable package names use
  `@packages/<slug>`.

- Clarify workflow gates and completion: increments run `check:code`, phase
  boundaries run the complete `check`, web surfaces must build before being
  marked complete, and unavailable browser tooling leaves visual verification
  pending for explicit desktop and mobile confirmation.

## 0.7.0

### Minor Changes

- Name each application's progress phase after its type, `web-surface`,
  `api-surface`, or `worker-surface`, so an outcome identifies the workflow that
  can advance it. A phase whose workflow is not installed is reported as
  unroutable instead of being routed into a workflow that rejects the
  application. Previously every application declared a single `surface` phase,
  so `api` and `worker` applications produced an outcome no installed workflow
  could accept.

  Existing generated repositories must rename each `- \`surface\`:` progress
  line in `PROJECT.md` to its application's typed phase before using the
  progress tool again.

- Detect setup readiness by rejecting only genuine conflicts instead of allowing
  a fixed list of entries. A repository is ready when it contains no application
  code, no `package.json` or lockfile, no `apps/`, `packages/` or `src/`, none of
  the generated tooling configuration, and none of setup's own output.
  Documentation, editor and CI configuration, an existing `node_modules`, and
  other unrelated files no longer block initialization.

- Make `flow` routing deterministic. A bundled `route.mjs` resolves durable
  project state and a declarative `routes.json` rule table into one decision —
  `run`, `choose`, `done`, or `blocked` — instead of having the agent inspect
  the repository and match outcomes against skill descriptions. Open work with
  no installed workflow is reported explicitly rather than retried, and adding a
  workflow is a rule change instead of a prompt change.

- Make one workflow run the unit of delegation. Keep a single worker alive for
  a run's whole duration instead of re-spawning it per question, and fall back
  to local execution where workers cannot persist. Drop that run's context at
  its boundary so a new application starts from durable artifacts rather than
  from the previous one's decisions.

- Separate the per-edit gate from the boundary gate. A new `check:code` script
  runs Biome and type checking, the invariants that hold after every edit, and
  is what `typescript-stack` and `to-web-surface` run between increments.
  `npm run check` keeps its full meaning and adds Knip's unused-code analysis at
  a task or phase boundary. Previously the increment loop ran the complete gate,
  so a component written before the screen that renders it failed as an unused
  file and the instruction to resolve diagnostics at their source pointed at
  deleting correct work in progress.

- Make the unused-code check silent when it has nothing to report. `knip.json`
  no longer ignores `dist` and `.turbo`, which Knip already skips through the
  `.gitignore` setup guarantees, and `check:knip` suppresses configuration
  hints. Every run previously printed four hints asking to delete generated
  rules, including the opaque-asset boundary that has no match until an
  application ships one and that the repository must keep.

### Patch Changes

- Verify the toolchain once per workflow run instead of once per code change.
  `typescript-stack` re-ran `check:toolchain` before every increment even though
  the `npm run check` that closes the increment already contains it, so each
  increment paid for two full verifications. The rule it protected — never
  initialize or migrate tooling during a code change — stays.

- Distinguish an uninstalled `node_modules` from a broken toolchain. The
  verifier reported a fresh clone as `installed fastify is missing or
  unreadable: ENOENT`, which reads as a configuration failure and stopped the
  workflow instead of installing. It now names the missing packages, asks for
  `npm install`, and exits `3`, leaving exit `1` for genuine misconfiguration.
  `to-web-surface` installs and retries on that outcome.

- Describe `flow` delegation in terms of the guarantee it needs — a worker that
  starts from an empty context — instead of a named parameter of one agent
  harness. A mechanism that can only fork the current context does not satisfy
  it and counts as unavailable.

- Keep a freshly initialized repository green. `setup` previously wrote a single
  root `tsconfig.json` whose `include` patterns matched nothing until the first
  application workspace existed, so the `npm run check` that closes setup always
  failed with `TS18003`.

  Split the compiler configuration into a shared, environment-neutral
  `tsconfig.base.json` and a per-workspace `tsconfig.json` that declares the
  libraries its runtime provides. Run type checking through `turbo run
  typecheck`, which is a no-op with zero workspaces, and exclude Turborepo's
  `.turbo` cache from Biome, Knip, and the toolchain verifier.

  A browser surface and a Node application are no longer type-checked against
  the same globals.

- Generate `.gitignore` from a setup asset so `node_modules`, `dist`, `.turbo`,
  and `coverage` stay untracked. When the repository already has one, leave it
  untouched and require only that it covers those paths, reporting the missing
  entries rather than merging into a file setup does not own.

- Give each generated web surface a strict, fixed development port and report
  its preview URL, and make `to-web-surface` own exactly one background
  development server: started once, kept across increments through hot module
  replacement, recovered from an abandoned server holding the port, and stopped
  before the workflow ends. Make `flow` require its workers to release
  background processes on a terminal status.

## 0.6.0

### Minor Changes

- Add the user-invoked `flow` skill as the workflow orchestrator. It discovers
  the project's durable state, prioritizes resumable work, and immediately
  continues through the appropriate installed workflow in a clean,
  single-writer subagent context when supported, while keeping routing internal
  and user communication minimal.

- Rename the workflow category from `flow` to `workflows`, avoiding ambiguity
  between the category and its `flow` orchestrator.

## 0.5.0

### Minor Changes

- Organize end-to-end workflow skills under `flow` and reusable supporting
  guidance under `toolkit`, with matching documentation and catalog sections.

- Add the model-invoked `interview` toolkit skill for resolving dependent
  decisions through short, one-at-a-time questions with recommended answers and
  a durable artifact that can resume without chat history.

- Make `to-web-surface` maintain a confirmed, implementation-facing
  `SURFACE.md` before building, resume existing interviews and workspaces safely,
  and return newly discovered product decisions to the persistent interview.

## 0.4.0

### Minor Changes

- Add model-invoked frontend guidance with narrow activation boundaries:
  Anthropic's distinctive visual-design process, Vercel's React composition
  patterns, targeted interface accessibility fixes, and project-aware shadcn
  component and CLI workflows. Preserve upstream licenses and source revisions,
  and adapt shadcn's project-context discovery to portable agent harnesses.

## 0.3.1

### Patch Changes

- Require setup to account for product-specific vocabulary deliberately introduced by the user before generating the project preview.

## 0.3.0

### Minor Changes

- Generate confirmed domain language, complete block definitions, and logical relationships inside `PROJECT.md`, remove block marker documents, and keep the concise setup contract directly in the skill.

  Treat `PROJECT.md` as the sole marker of an initialized project.
  Derive repository block paths deterministically from block names.
  Limit setup previews to the generated `PROJECT.md`.
  Declare block paths without creating empty directories that Git cannot retain.
  Leave external dependencies to later surface workflows instead of modeling them as setup blocks.

- Make `typescript-stack` cover opaque JavaScript assets explicitly and remove redundant implementation guidance already owned by repository instructions or deterministic tooling.

## 0.2.0

### Minor Changes

- Keep generated repositories green after project-scoped skill installation by
  teaching Biome the installer-owned `skills-lock.json` serialization. Cover
  the real two-space lockfile format in the setup regression test.

### Patch Changes

- Turn the root README into an end-to-end getting-started guide covering
  requirements, project-scoped installation, first `setup` invocation, generated
  artifacts, daily skill use, and updates. Correct the documented single-skill
  installer syntax to match the `skills` CLI.

## 0.1.0

### Minor Changes

- Add the user-invoked `setup` skill for initializing an empty repository with an
  agreed project definition, solution map, block folders, and minimal agent
  entrypoints before any other workflow stage begins. Install a reusable,
  project-local repository-state helper for fast lifecycle checks by later
  skills. Use a schema-validated deterministic generator for previewing and
  materializing the approved foundation.
  Generate concise block-level `FOLDER.md` indexes containing each block's
  responsibility, contents, and inspection guidance.
  Keep generated agent responses concise while preserving necessary technical
  details, warnings, and requested explanations.
  Track long-running workflow deliverables with explicit `in-progress` and
  `complete` states instead of treating artifact existence as completion.
  Keep generated solution maps and folder indexes current as project boundaries
  change, and keep technical project artifacts in English.
  Make repository-state detection reliable when the script path contains
  filesystem aliases.

- Add the user-invoked `lazy` skill for forcing the smallest correct solution to
  coding tasks by questioning unnecessary work and resisting needless code,
  dependencies, files, and abstractions.

- Add the model-invoked `typescript-stack` skill for TypeScript and TSX code
  changes on the fixed Node.js, React/Vite, and Fastify platform. Make Biome,
  TypeScript, Knip, and the repository toolchain gates authoritative while
  keeping agent-owned semantic guidance concise.

  Extend `setup` to place repository-owned solution blocks under `src/` and
  give each one an exact `web`, `api`, or `worker` type. Generate non-duplicated
  Markdown contracts for the project definition, block-local facts, external
  blocks, and logical relationships. Materialize React/Vite, Fastify, the `tsx`
  runtime, and the code-quality toolchain once. Record compatible minimum versions in one policy, pin each
  repository's concrete Node.js and npm versions, and verify all application
  TypeScript remains under `src/`. Reserve
  `src/<block>/assets/**/*.js` for JavaScript delivered byte-for-byte and exclude
  oxlint, and dprint dependencies so Biome remains the sole formatting and
  linting authority with its recommended rules. Require every generated
  repository to retain native ESM through an exact `"type": "module"` package
  declaration.
