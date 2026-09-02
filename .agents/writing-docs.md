# Writing skill documentation

Every promoted skill has a human-facing documentation page at
`docs/<bucket>/<skill-name>.md`. The docs tree mirrors the `engineering` and
`productivity` buckets under `skills/`.

The page explains when and why to use the skill. It does not duplicate the
procedural instructions in `SKILL.md`.

Use this section order:

1. `## What it does`
2. `## When to reach for it`
3. `## Prerequisites`, only when required
4. One to three skill-specific sections
5. `## Common questions`, when supported by real questions
6. `## It's working if`
7. `## Where it fits`

Do not include installation commands in individual skill pages. The canonical
commands live in [install-block.md](./install-block.md).

Create or resynchronize the page whenever a promoted skill is added, renamed,
moved, or behaviorally changed. Skills in `misc`, `in-progress`, and
`deprecated` do not receive documentation pages.
