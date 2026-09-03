# Setup

## What it does

`setup` initializes the permanent project context and predefined TypeScript
platform for an empty repository. It turns a rough idea into an agreed project
definition and domain language, identifies typed applications and their logical
interactions. `PROJECT.md` records application paths and responsibilities so
later agents can avoid broad codebase exploration.

It creates one canonical `AGENTS.md`; `CLAUDE.md` imports it so agent harnesses
share the same instructions without duplication.

It also installs npm workspaces, Turborepo, React/Vite, Fastify, the `tsx`
runtime, Biome, TypeScript, Knip, minimum-version policy,
repository-specific runtime pins, and a read-only toolchain verifier.

## When to reach for it

Invoke `setup` once, before any other workflow skill and before application
code or an established project structure exists. It is not an update,
migration, or repair command.

## Prerequisites

The current directory must be an otherwise empty Git repository without
`AGENTS.md` or `PROJECT.md`. Common repository metadata, installed agent
skills, and `skills-lock.json` are allowed.

## Generated foundation

```text
AGENTS.md
CLAUDE.md
PROJECT.md
.gitignore
.agents/
├── toolchain-policy.json
└── tools/
    ├── project-progress.mjs
    ├── repo-state.mjs
    └── verify-toolchain.mjs
biome.json
knip.json
package.json
tsconfig.base.json
turbo.json
```

`PROJECT.md` owns the global product definition, confirmed project-specific
domain terms, application names, types, paths, responsibilities, logical
relationships, and phase progress. Every application starts with its `surface`
phase set to `pending`. The generated progress tool permits only deterministic
`pending` to `in-progress` to `complete` transitions. Its Language section
defines canonical terms without requirements, implementation details, or
general programming terminology. Setup declares application paths without
creating empty directories.

The repository-state tool reports initialization state and, for initialized
repositories, every application's type, path, responsibility, and phase
progress. The progress tool remains the only writer for phase transitions.

Each application path is an architectural boundary under `apps/`. Its `surface/`
directory becomes an independently runnable npm workspace when a later workflow
materializes it. Reusable packages live under `packages/`. Turborepo coordinates
workspace development, builds, and type checking; it does not define runtime
communication between applications.

`tsconfig.base.json` holds the shared, environment-neutral compiler options.
Each workspace owns a `tsconfig.json` that extends it and declares the libraries
its runtime actually provides, so a browser surface and a Node application are
never type-checked against the same globals. The root `typecheck` script runs
`turbo run typecheck` across workspaces, which is a no-op until the first one
exists.

`.gitignore` is the one conditional output. Setup writes the template when the
repository has none, and otherwise leaves an existing file untouched after
checking that it already ignores `node_modules`, `dist`, `.turbo`, and
`coverage`. It reports the missing entries instead of merging into a file it
does not own.

Application paths are derived deterministically from their names; setup
does not ask the agent to choose a second identifier. The workflow that first
writes application content creates its directory.

For each product-specific term introduced by the user, setup proposes a concise
definition and asks for confirmation. It also discovers interactions
conversationally and may propose missing applications for confirmation. It
records only relationships among applications the repository will build;
external dependencies and infrastructure belong to later surface workflows.
Before writing, it previews only `PROJECT.md`; the remaining output is fixed by
the platform.

JavaScript that must be delivered without transformation is permitted only at
`apps/<app>/surface/public/**/*.js`. Biome and Knip ignore that narrow asset
boundary; other JavaScript module formats under `apps/` and `packages/` are
rejected.

Biome checks `skills-lock.json` using the upstream skills installer's canonical
two-space serialization. The lockfile remains tool-owned and committed for
reproducible project-scoped skill installations.

The toolchain verifier requires the fixed platform at compatible minimum
versions, rejects direct ESLint, Prettier, oxlint, and dprint dependencies, and
requires native ESM through an exact `"type": "module"` declaration in
`package.json`. Biome remains the sole formatter and linter, using its
recommended rules without a separate house style.

## It's working if

A new agent can start at `AGENTS.md`, use `PROJECT.md` to select the relevant
application and domain language, avoid reading unrelated repository content, and
run a green `npm run check` against the project contract and repository-pinned
toolchain.

## Where it fits

`setup` is the one-time repository bootstrap. Later workflow skills consume its
project definition, domain language, application map, progress, and toolchain.
`typescript-stack` consumes the generated gates, while application code is the
durable output of surface workflows.
