# Agent instructions

## Working principles

- Keep responses concise, direct, and information-dense. Preserve necessary technical details, warnings, and requested explanations.
- Write technical repository content in English.

## Repository maintenance

Skills live at `skills/<name>/`; do not add category or empty folders. Every
skill must appear in the top-level `README.md`, with human-facing documentation
at `docs/<name>.md`.

Documentation explains when and why to use a skill without duplicating its
procedure or installation commands. Use `What it does`, `When to reach for it`,
`It's working if`, and `Where it fits` sections; add prerequisites only when
needed. Keep installation commands in the top-level `README.md`.

Every skill is either user-invoked or model-invoked. For user-invoked skills,
set `disable-model-invocation: true` in `SKILL.md` and
`policy.allow_implicit_invocation: false` in `agents/openai.yaml`. For
model-invoked skills, omit both settings and use precise trigger language in the
description. Keep both harness policies aligned and record the mode in the
top-level catalog.

Every version bump must include the corresponding `CHANGELOG.md` entry before
publication.
