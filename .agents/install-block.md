# Canonical installation commands

Installation commands have one source of truth. Update this file first, then
copy the commands verbatim into `README.md`, release notes, and other
user-facing documentation.

## Claude Code plugin

This repository is its own Claude Code marketplace.

<canonical-block name="claude-code">

```text
/plugin marketplace add sha3dev/skills
/plugin install sha3dev-skills@sha3dev
```

</canonical-block>

## Codex and other agents

[`skills.sh`](https://skills.sh/sha3dev/skills) copies editable skill files into
the consuming project.

<canonical-block name="skills-sh-whole-set">

```bash
npx skills@latest add sha3dev/skills
```

</canonical-block>

Use the single-skill form when documenting one named skill:

<canonical-block name="skills-sh-one-skill">

```bash
npx skills@latest add sha3dev/skills --skill=<name>
```

```bash
npx skills@latest update <name>
```

</canonical-block>

The Claude Code plugin is a managed bundle. `skills.sh` creates editable files
and manages `skills-lock.json` in the consuming project. Users should choose
one installation route.
