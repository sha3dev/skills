# sha3dev Skills

Agent skills used for practical software engineering and productivity workflows.

The collection follows the same distribution model as
[`mattpocock/skills`](https://github.com/mattpocock/skills): skills are ordinary,
editable files, grouped by purpose and installable across compatible agent
harnesses.

## Installation

Choose one installation route. Installing both routes can expose duplicate
skills to Claude Code.

### Claude Code plugin

Add this repository as a marketplace, then install the plugin:

```text
/plugin marketplace add sha3dev/skills
/plugin install sha3dev-skills@sha3dev
```

The plugin is a managed bundle. Pulling a newer plugin version updates the
skills supplied by the repository.

### Codex and other agents

```bash
npx skills@latest add sha3dev/skills
```

The installer lets you choose the skills and target agents. It copies editable
skill files into the consuming project.

Project-scoped installations create `skills-lock.json`. The lockfile is owned
by the upstream `skills` CLI, records installed sources and content hashes, and
should be committed by the consuming project.

Update installed skills with:

```bash
npx skills@latest update
```

## Skill organization

- [`engineering`](./skills/engineering/README.md): daily software engineering work.
- [`productivity`](./skills/productivity/README.md): general workflow tools.
- [`misc`](./skills/misc/README.md): maintained skills that are not promoted.
- [`in-progress`](./skills/in-progress/README.md): public beta skills.
- [`deprecated`](./skills/deprecated/README.md): retired skills retained for reference.

## Catalog

### Engineering

#### User-invoked

- [`lazy`](./docs/engineering/lazy.md): Force the smallest correct implementation without unnecessary code, dependencies, files, or abstractions.
- [`setup`](./docs/engineering/setup.md): Initialize project context, typed solution topology, agent entrypoints, and the fixed TypeScript toolchain.

#### Model-invoked

- [`typescript-stack`](./docs/engineering/typescript-stack.md): Write TypeScript through the repository's Biome, TypeScript, Knip, and toolchain gates.

### Productivity

No productivity skills have been published yet.

## Maintainer commands

List every skill:

```bash
scripts/list-skills.sh
```

Link repository skills into local Claude Code and Agent Skills directories:

```bash
scripts/link-skills.sh
```

Validate repository contracts and the setup initializer:

```bash
npm run check
```

Create a release changeset:

```bash
npm run changeset
```
