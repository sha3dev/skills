---
name: to-architecture-surface
description: Approve infrastructure, its broad uses, and environment configuration after Flow application surfaces and connections. No runtime integration.
disable-model-invocation: true
---

# To Architecture Surface

Define which infrastructure the project will use, what each component is for,
and the environment configuration it needs. The approval deliverable is this
configuration and its concise context, not an app/package design.

## Entry

Read `.flow/architecture/surface.md` when resuming, then `.flow/project.json`.
Require all application phases complete, project-level `architecture-surface`
progress, and compatible generated tools. Report missing setup support instead
of editing state by hand. Later revisions follow Flow's active approved change.

```bash
node .flow/tools/project-progress.mjs --root . --project --phase architecture-surface --set in-progress
```

## Interview and configuration

Read approved web, API, worker, and connection contracts and existing environment
examples before identifying infrastructure needs. Inspect local configuration
without printing credentials. Reuse confirmed decisions and existing variable
names; distinguish planned capabilities from services already available.

Use `interview` with `.flow/architecture/surface.md` as its durable artifact.
Ask one short question at a time, driven by actual functionality rather than a
fixed technology checklist. Recommend a choice with a reason when useful;
availability alone does not justify using a service. Adding nothing is valid.
Resolve components and broad purposes before their configuration details.

For each component, define the necessary environment variables, meaning,
required or optional status, intended environment/consumer, and known value or
explicit pending status. Distinguish missing credentials from undecided
architecture. Do not invent tokens, endpoints, or connection strings.

Maintain `.env.example` (or established per-app equivalents) with descriptions,
safe non-secret values, and clearly marked placeholders. Preserve unrelated
entries. Put actual sensitive values only in the corresponding local ignored
environment files, preserving existing values. Verify Git ignores those files
before writing secrets; never put secrets in tracked artifacts, interview
questions, approval summaries, logs, or change documents. Ask the user to enter
credentials locally rather than paste them into the interview. Record only
whether a value is configured or pending, never its sensitive contents.

## Approval

Keep `.flow/architecture/surface.md` concise: components and broad uses,
references to environment examples, unresolved configuration, and approval
state. Keep the variable catalog in the examples instead of duplicating it.

Review coverage against the approved functionality and check consistency between
configuration files and decisions without exposing values or contacting services.
Present the configuration contract and pending values for human approval.
Unresolved component or usage decisions prevent completion; unavailable values
may remain pending only when the user explicitly accepts that limitation.

After approval, record the decision and run:

```bash
node .flow/tools/project-progress.mjs --root . --project --phase architecture-surface --set complete
```

Only architecture documentation, environment files, necessary ignore rules, and
workflow progress change. Do not provision services, install clients, connect
infrastructure, design packages, or replace fixtures. Runtime and browser gates
do not apply. Completion approves configuration intent, not working connectivity.
`to-domain-surface` consumes this approved architecture to design the minimal
code structure; a service does not automatically imply a package.
