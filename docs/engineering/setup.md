# Setup

## What it does

`setup` initializes the permanent project context and predefined TypeScript
platform for an empty repository. It turns a rough idea into an agreed project
definition, identifies typed solution blocks and their logical interactions,
creates repository-owned block folders under `src/`, and writes a small map
that later agents can use to avoid broad codebase exploration.

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
`AGENTS.md` or `SOLUTION-MAP.md`. Common repository metadata, installed agent
skills, and `skills-lock.json` are allowed.

## Generated foundation

```text
AGENTS.md
CLAUDE.md
PROJECT.md
SOLUTION-MAP.md
.agents/
├── toolchain-policy.json
└── tools/
    ├── repo-state.mjs
    └── verify-toolchain.mjs
src/
└── <solution-block>/
    └── FOLDER.md
biome.json
knip.json
package.json
tsconfig.json
```

Each repository-owned `FOLDER.md` is the sole source for that block's type
(`web`, `api`, or `worker`), responsibility, high-level contents, and reading
guidance. `SOLUTION-MAP.md` links those folders without repeating their facts;
it alone defines logical relationships and any external blocks. `PROJECT.md`
alone owns the global product definition.

Setup discovers interactions conversationally and may propose missing blocks
for confirmation. It records purposes and direction, not URLs, protocols,
databases, queues, deployments, or other infrastructure.

JavaScript that must be delivered without transformation is permitted only at
`src/<block>/assets/**/*.js`. Biome and Knip ignore that narrow asset boundary;
other JavaScript module formats under `src/` are rejected.

The toolchain verifier requires the fixed platform at compatible minimum
versions, rejects direct ESLint, Prettier, oxlint, and dprint dependencies, and
requires native ESM through an exact `"type": "module"` declaration in
`package.json`. Biome remains the sole formatter and linter, using its
recommended rules without a separate house style.

## It's working if

A new agent can start at `AGENTS.md`, use `SOLUTION-MAP.md` to select the
relevant block, avoid reading unrelated repository content, and run a green
`npm run check:toolchain` against repository-pinned versions.

## Where it fits

`setup` is the one-time repository bootstrap. Later workflow skills consume its
project definition, solution map, and toolchain. `typescript-stack` consumes
the generated gates while later workflow skills persist their own work
artifacts under `.scratch/`.
