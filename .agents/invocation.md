# Model-invoked and user-invoked skills

Every `SKILL.md` has one invocation mode.

## User-invoked

A user-invoked skill is reachable only when the human invokes it explicitly.

- Set `disable-model-invocation: true` in `SKILL.md` frontmatter for Claude Code.
- Set `policy.allow_implicit_invocation: false` in `agents/openai.yaml` for Codex.
- Write a concise, human-facing description without automatic trigger phrases.

## Model-invoked

A model-invoked skill is reachable by either the model or the user.

- Omit `disable-model-invocation` from `SKILL.md` frontmatter.
- Omit `policy.allow_implicit_invocation` from `agents/openai.yaml`.
- Include precise trigger language in the description so automatic discovery is
  reliable.

Keep both harness policies aligned. A skill must not be user-invoked in one
harness and model-invoked in another.

Bucket README files and the top-level catalog group promoted skills under
`User-invoked` and `Model-invoked` headings.
