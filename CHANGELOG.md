# sha3dev-skills

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

### Patch Changes

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

- Make one workflow run the unit of delegation. Keep a single worker alive for
  a run's whole duration instead of re-spawning it per question, and fall back
  to local execution where workers cannot persist. Drop that run's context at
  its boundary so a new application starts from durable artifacts rather than
  from the previous one's decisions.

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
