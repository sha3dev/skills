# Setup

## What it does

`setup` initializes the permanent project context and predefined TypeScript
platform for an empty repository. It turns a rough idea into an agreed project
definition and domain language, identifies typed applications and their logical
interactions. `.flow/project.json` records application paths and responsibilities
so later agents can avoid broad codebase exploration.

It creates one canonical `AGENTS.md`; `CLAUDE.md` imports it so agent harnesses
share the same instructions without duplication.

It also installs npm workspaces, Turborepo, React/Vite, Fastify with OpenAPI
generation, the `tsx` runtime, Biome, TypeScript, Knip, minimum-version policy,
repository-specific runtime pins, and a read-only toolchain verifier.

## When to reach for it

Invoke `setup` once, before any other workflow skill and before application
code or an established project structure exists. It is not an update,
migration, or repair command.

## Prerequisites

The current directory must be a Git repository that contains no application
code and none of setup's own output. Repository metadata, documentation,
editor and CI configuration, installed agent skills, `skills-lock.json`, and an
existing `node_modules` are allowed; `AGENTS.md`, `CLAUDE.md`,
`.flow/project.json`, `package.json`, a lockfile, `apps/`, `packages/`, `src/`,
the generated tooling configuration, and top-level JavaScript or TypeScript
sources are not.

## Generated foundation

```text
AGENTS.md
CLAUDE.md
.flow/
├── project.json
├── toolchain-policy.json
└── tools/
    ├── project-progress.mjs
    ├── repo-state.mjs
    ├── validate-fixtures.mjs
    ├── verify-toolchain.mjs
    └── version-policy.mjs
.gitignore
.node-version
biome.json
knip.json
package.json
tsconfig.base.json
turbo.json
```

`.flow/project.json` owns the global product definition, confirmed
project-specific domain terms, application names, types, paths, responsibilities, logical
relationships, and phase progress. Every application starts with a phase named
after its type — `web-surface`, `api-surface`, or `worker-surface` — set to
`pending`. A web application that declares an outgoing relationship to an API
also starts with `api-connection: pending`. The generated progress tool permits
only deterministic `pending` to `in-progress` to `complete` transitions and
invalidates completed connections when either surface is reopened. Its `terms`
entries define canonical language without requirements, implementation details,
or general programming terminology. Setup declares application paths without
creating empty directories.

The repository-state tool reports initialization state and, for initialized
repositories, every application's type, path, responsibility, and phase
progress. The progress tool remains the only writer for phase transitions.

Surface workflows may create shared domain records under `.flow/fixtures/`.
Setup leaves that directory absent until data is needed and installs
`validate-fixtures.mjs`; `npm run check:fixtures` validates the JSON collection
shape and record identifiers as part of the complete repository gate.

Each application path is an architectural boundary under `apps/` and becomes an
independently runnable npm workspace when a later workflow materializes it. Its
application source belongs under `src/`, while reusable packages live under
`packages/`. Application workspace names use `@apps/<slug>` and reusable
package workspace names use `@packages/<slug>`. Turborepo coordinates workspace
development, builds, and type checking; it does not define runtime communication
between applications.

`tsconfig.base.json` holds the shared, environment-neutral compiler options.
Each workspace owns a `tsconfig.json` that extends it and declares the libraries
its runtime actually provides, so a browser surface and a Node application are
never type-checked against the same globals. The root `typecheck` script runs
`turbo run typecheck` across workspaces, which is a no-op until the first one
exists.

The generated scripts separate two gates. `npm run check:code` runs Biome and
type checking, the invariants that must hold after every edit, and is what an
incremental workflow runs between steps. `npm run check` is the complete gate:
it adds the project-state check, the toolchain and fixture validators, and
Knip's unused-code analysis, and belongs at a task or phase boundary where
unwired code is a real finding rather than work in progress.

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
records relationships from runtime consumer to provider, such as `web -> api`
when a browser application calls an API, and only among applications the
repository will build; external dependencies and infrastructure belong to later
surface workflows.
Before writing, it previews only `.flow/project.json`; the remaining output is
fixed by the platform.

JavaScript that must be delivered without transformation is permitted only at
`apps/<app>/public/**/*.js`. Biome and Knip ignore that narrow asset boundary;
other JavaScript module formats under `apps/` and `packages/` are rejected.

That asset boundary and `.flow/` are the only paths `knip.json` names. Knip
already skips whatever `.gitignore` covers, which setup guarantees includes
`dist` and `.turbo`, so listing them again would be dead configuration. Knip
runs with its configuration hints suppressed: a generated rule that matches
nothing yet is expected, and the hint asking to delete it is advice the
repository must not take.

Biome checks `skills-lock.json` using the upstream skills installer's canonical
two-space serialization. The lockfile remains tool-owned and committed for
reproducible project-scoped skill installations.

The toolchain verifier requires the fixed platform at compatible minimum
versions, rejects direct ESLint, Prettier, oxlint, and dprint dependencies, and
requires native ESM through an exact `"type": "module"` declaration in
`package.json`. Biome remains the sole formatter and linter, using its
recommended rules without a separate house style.

## It's working if

A new agent can start at `AGENTS.md`, use `.flow/project.json` to select the
relevant application and domain language, avoid reading unrelated repository
content, and run a green `npm run check` against the project contract and
repository-pinned toolchain.

## Where it fits

`setup` is the one-time repository bootstrap. Later workflow skills consume its
project definition, domain language, application map, progress, and toolchain.
`typescript-stack` consumes the generated gates, while application code is the
durable output of surface workflows.
