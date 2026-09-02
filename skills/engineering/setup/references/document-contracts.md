# Foundation document contracts

Generated Markdown is the permanent source of truth. Keep each fact in exactly
one document.

## `PROJECT.md`

Owns the project title and product definition. It does not list blocks or
relationships.

```markdown
# <project title>

## Definition

<one concise paragraph>
```

## `src/<block>/FOLDER.md`

Owns every repository block's name, type, responsibility, high-level contents,
and reading guidance. The type is exactly `web`, `api`, or `worker`.

```markdown
# <block name>

**Type:** `<web|api|worker>`

## Responsibility

<one concise responsibility>

## Contains

- <high-level area>

## Read when

- <reason to inspect this block>
```

## `SOLUTION-MAP.md`

Owns navigation, external block definitions, and logical relationships. For a
repository block it contains only a link to that block's `FOLDER.md`; it does
not repeat type or responsibility. An external block has no folder, so its name
and responsibility live here.

The Relationships section uses `from` to `to` direction: the first block
initiates the interaction and the second receives it. Relationship text states
purpose, not infrastructure. Omit External blocks when none exist and omit
Relationships when none exist.

```markdown
# Solution map

[Project definition](./PROJECT.md)

## Repository blocks

- [<repository block>](./src/<folder>/FOLDER.md)

## External blocks

- **<external block>** — <responsibility>

## Relationships

- <from reference> → <to reference> — <purpose>
```

A repository block reference is a Markdown link to its `FOLDER.md`. An external
block reference is its bold name.
