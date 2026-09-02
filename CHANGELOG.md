# sha3dev-skills

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
