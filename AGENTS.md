# Agent instructions

## Working principles

- Keep responses concise, direct, and information-dense. Preserve necessary technical details, warnings, and requested explanations.
- Write technical repository content in English.

## Repository maintenance

Skills live under `skills/engineering/`. Do not create empty bucket folders.
Every skill must be linked from the top-level `README.md`, listed in
`skills/engineering/README.md`, included in `.claude-plugin/plugin.json`, and
documented at `docs/engineering/<skill-name>.md`. Follow
[`.agents/writing-docs.md`](./.agents/writing-docs.md) when creating or changing
those pages.

Keep installation commands in the top-level `README.md`; do not duplicate them
in individual skill documentation.

Every `SKILL.md` is either user-invoked or model-invoked. Follow
[`.agents/invocation.md`](./.agents/invocation.md) and keep Claude Code and Codex
invocation policy aligned.

Use [`scripts/list-skills.sh`](./scripts/list-skills.sh) to list the catalog. Use
[`scripts/link-skills.sh`](./scripts/link-skills.sh) to link every active skill
into the local Claude Code and Agent Skills directories.

After editing `.claude-plugin/plugin.json` or
`.claude-plugin/marketplace.json`, run:

```bash
claude plugin validate . --strict
```

Run `npm run check` before finishing repository changes.
