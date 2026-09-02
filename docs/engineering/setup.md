# Setup

## What it does

`setup` initializes the permanent project context and predefined TypeScript
platform for an empty repository. It turns a rough idea into an agreed project
definition and domain language, identifies typed solution blocks
and their logical interactions. `PROJECT.md` records block paths and
responsibilities so later agents can avoid broad codebase exploration.

It creates one canonical `AGENTS.md`; `CLAUDE.md` imports it so agent harnesses
share the same instructions without duplication.

It also installs React/Vite, Fastify, the `tsx` runtime, Biome, TypeScript,
Knip, minimum-version policy, repository-specific runtime pins, and a
read-only toolchain verifier.

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
.agents/
├── toolchain-policy.json
└── tools/
    ├── repo-state.mjs
    └── verify-toolchain.mjs
biome.json
knip.json
package.json
tsconfig.json
```

`PROJECT.md` owns the global product definition, confirmed project-specific
domain terms, block names, types, paths, responsibilities, and logical
relationships. Its Language section defines canonical terms without
requirements, implementation details, or general programming terminology.
Setup declares block paths without creating empty directories.

Repository block paths are derived deterministically from their names; setup
does not ask the agent to choose a second identifier. The workflow that first
writes block content creates its directory.

For each product-specific term introduced by the user, setup proposes a concise
definition and asks for confirmation. It also discovers interactions
conversationally and may propose missing blocks for confirmation. It records
only relationships among blocks the repository will build; external
dependencies and infrastructure belong to later surface workflows.
Before writing, it previews only `PROJECT.md`; the remaining output is fixed by
the platform.

JavaScript that must be delivered without transformation is permitted only at
`src/<block>/assets/**/*.js`. Biome and Knip ignore that narrow asset boundary;
other JavaScript module formats under `src/` are rejected.

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
block and domain language, avoid reading unrelated repository content, and
run a green `npm run check:toolchain` against repository-pinned versions.

## Where it fits

`setup` is the one-time repository bootstrap. Later workflow skills consume its
project definition, domain language, block map, and toolchain.
`typescript-stack` consumes the generated gates while later workflow skills
persist their own work artifacts under `.scratch/`.
