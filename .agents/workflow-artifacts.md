# Sequential workflow artifacts

`setup` is the one-time exception to this convention. It creates the permanent
root project foundation (`AGENTS.md`, `CLAUDE.md`, and `PROJECT.md`) before
sequential work begins. It must not store those files under `.scratch/` or run
again after `PROJECT.md` exists.

Setup also installs the fixed TypeScript toolchain and
`.agents/tools/repo-state.mjs`. Later skills use that helper for repository
lifecycle checks instead of reproducing marker discovery in their instructions.
Setup's bundled `initialize-repository.mjs` validates one temporary structured
input and owns previewing and writing the root foundation; the model must not
reproduce that materialization manually.

Sequential workflow skills persist agreed deliverables as Markdown under:

```text
.scratch/<work-slug>/<artifact-name>.md
```

Each stage owns one Markdown tracking artifact, declares any prerequisite
artifacts in its instructions, and checks those prerequisites before starting.
Skills create and maintain that artifact while work progresses. Every artifact
declares one of these states in YAML frontmatter:

```yaml
---
status: in-progress
---
```

Use only `in-progress` and `complete`. Set `complete` only after explicit user
approval. Dependent skills must treat missing or incomplete artifacts as unmet
prerequisites.

Do not add a central state file while the workflow remains linear. Use explicit
dependency metadata only when stages can branch, block one another, or run
concurrently. Git remains the history of artifact revisions.
