# sha3dev-skills

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
