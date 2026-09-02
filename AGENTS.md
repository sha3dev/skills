# Agent instructions

## Working principles

- Keep responses concise, direct, and information-dense. Preserve necessary technical details, warnings, and requested explanations.
- Write technical repository content in English.

## Repository maintenance

Skills are organized into bucket folders under `skills/`:

- `engineering/`: daily software engineering work
- `productivity/`: general workflow tools
- `misc/`: maintained but not promoted
- `in-progress/`: public beta skills, excluded from plugin releases
- `deprecated/`: retired skills retained for reference

Every skill in `engineering/` or `productivity/` is promoted. Promoted skills
must be linked from the top-level `README.md`, listed in the matching bucket
`README.md`, included in `.claude-plugin/plugin.json`, and documented at
`docs/<bucket>/<skill-name>.md`. Follow
[`.agents/writing-docs.md`](./.agents/writing-docs.md) when creating or changing
those pages.

Skills in `misc/`, `in-progress/`, and `deprecated/` must not appear in the
top-level catalog or the Claude Code plugin manifest. They are listed only in
their bucket `README.md` and do not receive a page under `docs/`.

Install commands are copied from
[`.agents/install-block.md`](./.agents/install-block.md). Change that file first,
then propagate the exact commands to user-facing documentation.

Every `SKILL.md` is either user-invoked or model-invoked. Follow
[`.agents/invocation.md`](./.agents/invocation.md) and keep Claude Code and Codex
invocation policy aligned.

Sequential workflow skills persist their deliverables under `.scratch/`.
Follow [`.agents/workflow-artifacts.md`](./.agents/workflow-artifacts.md) when
adding or changing one of these skills.

Use [`scripts/list-skills.sh`](./scripts/list-skills.sh) to list the catalog. Use
[`scripts/link-skills.sh`](./scripts/link-skills.sh) to link every active skill
into the local Claude Code and Agent Skills directories.

After editing `.claude-plugin/plugin.json` or
`.claude-plugin/marketplace.json`, run:

```bash
claude plugin validate . --strict
```

Use Changesets for user-visible additions, removals, and behavioral changes.
Run `npm run check-plugin-version` after version-related changes.
Run `npm run check` before finishing repository changes.
