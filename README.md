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

Choose a project-scoped installation, select your agent, and install all nine
skills. Project-scoped installations create `skills-lock.json`; commit it so
the installed sources and content hashes remain reproducible.

Restart the agent in the repository after installation, then invoke `setup`
with the rough product idea. In Codex:

```text
$setup Build an editorial CMS and a public website for a video platform.
```

`setup` will guide the conversation. It will agree the product definition and
domain language, identify `web`, `api`, and `worker` applications, and discover
their logical relationships. It shows the generated `PROJECT.md` and waits for
approval before writing anything.

The generated foundation includes:

```text
AGENTS.md
CLAUDE.md
PROJECT.md
.agents/
biome.json
knip.json
package.json
tsconfig.json
turbo.json
```

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

Before setup, the repository may contain common metadata such as `.git`,
`.gitignore`, `README.md`, `LICENSE`, installed agent skills, and
`skills-lock.json`. It must not already contain application code, `AGENTS.md`,
or `PROJECT.md`.

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

When installing a flow skill individually, also install the toolkit skills
listed in its prerequisites.

## Available skills

### Flow

End-to-end development stages with an explicit start, progression, and finish.

| Skill | Invocation | Purpose |
| --- | --- | --- |
| [`setup`](./docs/flow/setup.md) | Explicit | Initialize an empty repository, define typed applications and relationships, and materialize the fixed toolchain. |
| [`to-web-surface`](./docs/flow/to-web-surface.md) | Explicit | Specify one web interface through a persistent design interview, then build it incrementally with the user. |

### Toolkit

Reusable constraints, practices, and specialist guidance that support the flow.

| Skill | Invocation | Purpose |
| --- | --- | --- |
| [`interview`](./docs/toolkit/interview.md) | Automatic | Resolve dependent decisions one question at a time while maintaining a durable, resumable artifact. |
| [`lazy`](./docs/toolkit/lazy.md) | Explicit | Force the smallest correct implementation and resist unnecessary code, dependencies, files, and abstractions. |
| [`typescript-stack`](./docs/toolkit/typescript-stack.md) | Automatic | Govern TypeScript and TSX changes through the repository's Biome, TypeScript, Knip, and toolchain gates. |
| [`frontend-design`](./docs/toolkit/frontend-design.md) | Automatic | Give new or substantially reshaped interfaces a distinctive, subject-specific visual direction. |
| [`composition-patterns`](./docs/toolkit/composition-patterns.md) | Automatic | Design scalable React component APIs when reuse or boolean-prop proliferation makes composition material. |
| [`fixing-accessibility`](./docs/toolkit/fixing-accessibility.md) | Automatic | Audit and fix accessibility when interactive controls, forms, dialogs, focus, or keyboard behavior change. |
| [`shadcn`](./docs/toolkit/shadcn.md) | Automatic | Work with shadcn projects, registries, components, and presets using live project and CLI context. |

`setup` runs once. Invoke `to-web-surface` for a `web` application; it uses
`interview` to resolve the UI specification one question at a time, then
iterates on the resulting live interface until approval. `typescript-stack` is
selected automatically whenever the agent writes application TypeScript or TSX.
Invoke `lazy` explicitly when simplicity is the main constraint for a task.
`frontend-design`, `composition-patterns`, and `fixing-accessibility` activate
only for their respective UI concerns. `shadcn` activates for projects that
already contain `components.json` or when shadcn is explicitly requested; it
does not introduce shadcn into every React application.

API and worker surface workflows are planned but are not included yet.

## Updating

Update project-scoped skills installed through the `skills` CLI with:

```bash
npx skills@latest update
```

Review and commit the resulting skill files and `skills-lock.json` changes.
