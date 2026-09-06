---
name: db-migrations
description: Design, implement, or review incremental database schema migrations and their execution history. Use for schema upgrades, migration runners, and checksum failures; not for legacy data transfers or routine queries.
---

# Incremental database migrations

Read the affected product contracts, schema, migration history, runner, and direct
consumers. Use the approved database engine and tooling; this skill does not
select a database or introduce a migration framework. Apply
[db-naming](../db-naming/SKILL.md) when defining database objects.

## Compatibility and preservation

- Preserve existing data and the current application's reads and writes through
  each increment, including consumers still running during deployment.
- Prefer additive changes. Do not drop tables or columns, delete retained data,
  or perform destructive replacements without an explicit request covering the
  specific operation. A general refactor or migration request is insufficient.
- Additions also require compatibility checks. New required columns, uniqueness,
  foreign keys, checks, defaults, and type changes can reject existing writes or
  change their meaning. Inspect consumers and existing-data assumptions first.
- For incompatible replacements, expand the schema, maintain consistent old and
  new representations, backfill and verify, then move consumers. Define write
  ownership during coexistence. Retain the old representation until its removal
  is explicitly requested and remaining dependencies have been checked.
- Assess locks, table rewrites, and duration for the affected operations. Choose
  bounded backfills and engine-supported online operations where needed; do not
  assume an additive change preserves availability.

## Files and database history

Keep ordered, uniquely versioned migration files. Applied migrations are immutable:
correct them with a later migration rather than editing, renaming, or deleting
history. New migrations must follow the applied sequence; reject duplicate
versions and unexpected gaps relative to the repository's ordered history.

Use the established runner's history mechanism and checksum format. Do not add
a second tracking table or rename framework-owned fields to match this skill.
History must identify applied migrations, their order, successful application,
and integrity against changed files. If the existing mechanism cannot establish
these properties, report the specific gap before extending it.

For a new custom runner, a single database history table with migration version,
description, SHA-256 file checksum, and application time is sufficient.

Derive the current version from validated history; do not maintain a second
independent version counter. An empty history means no migrations are applied.
Keep file encoding and line endings stable because byte changes affect checksums.
Checksums verify migration files, not live schema drift from manual changes.

If canonical current-state SQL is maintained, keep it consistent with migrations.
A schema snapshot does not upgrade an existing database or replace its history.

## Execution and integrity

1. Confirm the target environment and existing authorization. Develop and test in isolated databases; apply to the intended environment
   under the existing explicit authorization. Use a database-scoped execution lock before reading
   history and retain it through validation and application to prevent concurrent
   runners. Bootstrap the history table under that lock when necessary.
2. Validate the complete applied history against repository files before executing
   any pending migration. Missing applied files or inconsistent ordering are
   blocking integrity errors.
3. On any checksum mismatch, stop the process with a failure result and notify the
   user, identifying the migration version, file, and expected and actual checksums.
   Apply no pending migrations. Never automatically overwrite the stored checksum,
   edit history, reapply the changed file, or bypass validation. Resolve the
   discrepancy with the user before resuming.
4. Apply only pending migrations, in order. Where supported, commit each schema
   change and its successful history entry in the same transaction. On failure,
   stop; do not mark the failed migration as applied or continue with later ones.
5. For operations that cannot run transactionally, define partial-failure detection
   and safe recovery before execution. Do not blindly retry a partially applied
   change. Record success only after its required operations are verified complete.

Rerunning the runner must skip validated applied migrations. This does not require
every migration statement to be independently idempotent; existence guards must
not conceal unexpected schema differences. Prefer forward corrective migrations
over automatic destructive rollback. Application rollback must remain compatible
with the resulting schema and writes already accepted.

## Verification and reporting

For implemented migrations, verify empty-database creation and upgrade from the
previous version using synthetic records. Exercise affected old-consumer reads
and writes, meaningful data preservation, and new constraints.

When implementing or changing the runner, verify ordered application, a no-op
rerun, checksum failure before any pending change, failure without a false success
entry, and exclusion of concurrent runners. Exercise partial-failure recovery
when nontransactional operations are supported.

Report the resulting version, checks performed, and limitations in chat. Keep
schema contracts and operating commands current in repository documentation.
Skill validation or static SQL review does not establish runtime correctness.
