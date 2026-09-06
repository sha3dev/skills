# Setup

## What it does

`setup` initializes the permanent project context and predefined TypeScript
platform for an empty repository. It turns a rough idea into an agreed project
definition and domain language, identifies typed applications and their logical
interactions across `web`, `api`, and `worker` applications. `.flow/project.json` records application paths and responsibilities
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

The foundation keeps product definition, domain terms, application boundaries,
relationships, and phase progress in `.flow/project.json`. Generated tools
validate that state and remain the only writers for progress transitions;
reopening a surface invalidates affected API connections.

Each application later becomes an npm workspace under `apps/`, shared source
belongs under `packages/`, and deterministic domain records may live under
`.flow/fixtures/`. The fixed TypeScript platform separates the fast Biome and
typecheck iteration gate from the complete project, toolchain, fixture, and
unused-code gate. Turborepo invalidates application checks when shared fixtures
or compiler configuration change.

Setup previews the product-specific project definition before writing. The
remaining generated files are fixed platform assets, and an existing
`.gitignore` is preserved when it already covers the required generated output.

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

Setup also initializes project-level `architecture-surface` and `domain-surface`
progress, in that order. Once all
application phases are complete, Flow can route the architecture review.

The generated progress tools also support subsequent global changes managed by
Flow, with one active change and separate proposal and integrated approvals.
Setup creates no change documents or empty directories. Existing projects need
updated generated tools to use this lifecycle; installed skill updates alone
do not migrate their snapshots.
