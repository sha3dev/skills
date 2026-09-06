# sha3dev Skills

Agent skills for taking a software project from an initial idea to working
TypeScript code through explicit, incremental workflows.

The platform is intentionally fixed: npm workspaces with Turborepo, Node.js
with `tsx` for server-side TypeScript, React/Vite for web interfaces, Fastify
for APIs, and Biome, TypeScript, and Knip for deterministic code-quality checks.

## Quick start

Start in a new or otherwise empty Git repository. `setup` deliberately refuses
to initialize an existing application or overwrite project files.

```bash
mkdir my-project
cd my-project
git init
npx skills@latest add sha3dev/skills
```

Choose a project-scoped installation, select your agent, and install the catalogued
skills. Project-scoped installations create `skills-lock.json`; commit it so
the installed sources and content hashes remain reproducible.

Restart the agent in the repository after installation. Invoke `flow` to enter
or continue the appropriate workflow, optionally adding context about current
work and next priorities:

```text
$flow
```

For example: `$flow We have refined the home page header, but the rest of the
web surface is unfinished. Continue with the remaining pages.`

In a new repository it starts the setup flow and asks for the rough product
idea. It will agree the product definition and domain language, identify `web`,
`api`, and `worker` applications, and discover their logical relationships. It
shows the generated `.flow/project.json` and waits for approval before writing
anything.

The generated foundation includes:

```text
AGENTS.md
CLAUDE.md
.flow/
├── project.json
├── toolchain-policy.json
└── tools/
.gitignore
.node-version
biome.json
knip.json
package.json
tsconfig.base.json
turbo.json
```

`setup` does not copy the installed skills into this foundation. They remain
installer-managed project dependencies; only the project-owned instructions,
state tools, and toolchain configuration above are generated snapshots.

After approval, `setup` installs the fixed platform and runs its toolchain
verification. You can repeat that read-only check at any time:

```bash
npm run check:toolchain
```

## Requirements

- Git.
- Node.js 22.12.0 or newer.
- npm 10.9.0 or newer.
- An agent supported by the [`skills`](https://skills.sh/) installer.
- Browser automation available to surface and connection workflows.

Before setup, the repository may contain metadata, documentation, editor and
CI configuration, installed agent skills, and `skills-lock.json`. It must not
already contain application code, a `package.json` or lockfile, `apps/`,
`packages/`, `src/`, `AGENTS.md`, `CLAUDE.md`, or `.flow/project.json`.

## Installation

```bash
npx skills@latest add sha3dev/skills
```

The installer lets you choose the skills, target agents, and project or global
scope. Project scope is recommended because each repository then records its
own skill dependencies.

To install one named skill:

```bash
npx skills@latest add sha3dev/skills --skill <name>
```

When installing a workflow skill individually, install every skill listed in
its prerequisites. The surface workflows also require `setup` because their
initializers share its scaffold code. `flow` requires every workflow it may
route; install the full catalog when using it as the project entry point.

### Browser automation

Surface and connection workflows accept any browser automation that can
navigate a local preview, resize its viewport, inspect rendered output, and
exercise interactions. To install the recommended Playwright MCP:

```bash
# Codex
codex mcp add playwright -- npx -y @playwright/mcp@latest

# Claude Code
claude mcp add --transport stdio --scope user playwright -- \
  npx -y @playwright/mcp@latest
```

Restart the agent after configuration so the tools load into the new session.
API review additionally requires tooling that can inspect print media or create
and render a temporary PDF.

## Available skills

### Workflows

End-to-end development stages with an explicit start, progression, and finish.

| Skill | Invocation | Purpose |
| --- | --- | --- |
| [`flow`](./docs/workflows/flow.md) | Explicit | Select and run the appropriate workflow in an isolated worker context. |
| [`setup`](./docs/workflows/setup.md) | Explicit | Initialize an empty repository, define typed applications and relationships, and materialize the fixed toolchain. |
| [`to-web-surface`](./docs/workflows/to-web-surface.md) | Explicit | Specify one web interface through a persistent design interview, then build it incrementally with the user. |
| [`to-api-surface`](./docs/workflows/to-api-surface.md) | Explicit | Specify an API contract, then iterate on its visual review surface and fixture-backed Fastify implementation. |
| [`to-worker-surface`](./docs/workflows/to-worker-surface.md) | Explicit | Describe background processes and configuration through a concise visual contract with linked parameter defaults. |
| [`connect-to-api`](./docs/workflows/connect-to-api.md) | Explicit | Connect a completed application surface to its APIs; currently supports web consumers. |
| [`to-architecture-surface`](./docs/workflows/to-architecture-surface.md) | Explicit | Approve infrastructure, its broad uses, and environment configuration through an interview. |
| [`to-domain-surface`](./docs/workflows/to-domain-surface.md) | Explicit | Design minimal app/package ownership using approved functionality and infrastructure, without implementing code. |

### Toolkit

Reusable constraints, practices, and specialist guidance that support the workflows.

| Skill | Invocation | Purpose |
| --- | --- | --- |
| [`workflow-run`](./docs/toolkit/workflow-run.md) | Automatic | Share application run checks, process ownership, durable context, completion, and revision rules. |
| [`interview`](./docs/toolkit/interview.md) | Automatic | Resolve dependent decisions one question at a time while maintaining a durable, resumable artifact. |
| [`fixtures`](./docs/toolkit/fixtures.md) | Automatic | Maintain deterministic domain records that disconnected application surfaces can reuse and extend. |
| [`rest-api-design`](./docs/toolkit/rest-api-design.md) | Automatic | Shape resource names, methods, representations, status codes, and collection conventions for an HTTP contract. |
| [`db-naming`](./docs/toolkit/db-naming.md) | Automatic | Apply consistent relational schema names and canonical SQL conventions within approved schema work. |
| [`db-migrations`](./docs/toolkit/db-migrations.md) | Automatic | Preserve data and application compatibility through incremental schema upgrades and validated migration history. |
| [`fastify-best-practices`](./docs/toolkit/fastify-best-practices.md) | Automatic | Apply adapted upstream Fastify guidance for plugins, schemas, routes, lifecycle, security, and testing. |
| [`lazy`](./docs/toolkit/lazy.md) | Explicit | Force the smallest correct implementation and resist unnecessary code, dependencies, files, and abstractions. |
| [`typescript-stack`](./docs/toolkit/typescript-stack.md) | Automatic | Govern TypeScript and TSX changes through the repository's Biome, TypeScript, Knip, and toolchain gates. |
| [`frontend-design`](./docs/toolkit/frontend-design.md) | Automatic | Design new interfaces and evolve existing ones within their approved visual direction. |
| [`composition-patterns`](./docs/toolkit/composition-patterns.md) | Automatic | Design scalable React component APIs when reuse or boolean-prop proliferation makes composition material. |
| [`fixing-accessibility`](./docs/toolkit/fixing-accessibility.md) | Automatic | Audit and fix accessibility when interactive controls, forms, dialogs, focus, or keyboard behavior change. |
| [`shadcn`](./docs/toolkit/shadcn.md) | Automatic | Work with shadcn projects, registries, components, and presets using live project and CLI context. |

`flow` is the only workflow entry point users need to know. It selects and
continues the applicable installed workflow in an isolated worker context
when supported. After initial completion, a feature or revision opens one
project-wide change through the same entry point. Flow prepares its proposal,
records human approval, and executes the affected phases in the approved order.
Bare `flow` resumes existing work without creating a change.
Each workflow gets one writer and durable artifacts remain canonical.
During initial construction, `setup` runs once, `to-web-surface` handles a `web` application, and
`to-api-surface` handles an `api` application after its related web consumers
are complete. `connect-to-api` then replaces each web's local repositories
with HTTP adapters after all its related API surfaces are complete. Web and API surface
workflows use `interview` to resolve their contract one question at a time and
`fixtures` to evolve shared example data behind replaceable repositories. All
application workflows defer their entry check, development server
ownership, completion gate, revision rule, and run boundary to `workflow-run`,
so no phase reaches `complete` without an explicit user approval. API
contracts apply `rest-api-design` while the interview shapes them, API
implementation and integration apply `fastify-best-practices` where they change
Fastify code, and APIs generate OpenAPI from route schemas. Each API also serves
a model-designed, printable contract document that reads that OpenAPI at runtime
so the user can scan and approve the evolving API visually. `typescript-stack`
is selected automatically whenever the agent writes application TypeScript or
TSX.
`to-worker-surface` handles `worker` applications with a read-only document:
short process descriptions, highlighted configuration references, and a complete
parameter catalog. It defines behavior without simulations or running background
tasks. Runtime implementation and worker integrations are separate work.
After all application phases complete, `to-architecture-surface` interviews the
user to approve infrastructure, its broad uses, and environment configuration.
Sensitive values remain in local ignored files; services stay disconnected.
Then `to-domain-surface` uses that approved architecture to document the
project-wide app/package split and single ownership of shared responsibilities.
Its Markdown review uses fixtures as examples and requires human design
approval, without creating packages or running application/browser gates.
Later changes live at `.flow/changes/<slug>.md`, with lifecycle and ordered steps
in `project.json`: `proposed` → `approved` → `implementing` → `in-review` →
`complete`. Only one change is active. Flow manages its files and state; the
user approves scope and the integrated result. Current contracts remain the
product definition, and closed change records remain distinct. Application
changes include affected connections, architecture review, and domain reconciliation. This cycle
revises declared outcomes; unsupported implementation or application-inventory
changes require corresponding workflow or tooling support.

Invoke `lazy` explicitly when simplicity is the main constraint for a task.
`frontend-design`, `composition-patterns`, and `fixing-accessibility` activate
only for their respective UI concerns. `shadcn` activates for component work in
projects with `components.json` or when shadcn is explicitly requested; it
does not introduce shadcn into every React application.

Workflows reuse unchanged context and verified results within a run. Source
inspection starts at the affected contracts and data boundaries; specialized
references load only for relevant tasks. Incremental visual checks follow
rendered changes, while completion retains whole-surface review and project gates.

## Updating

Update project-scoped skills installed through the `skills` CLI with:

```bash
npx skills@latest update
```

Review and commit the resulting skill files and `skills-lock.json` changes.
This does not rewrite the project-owned `.flow/tools/` snapshot created by
`setup`.
