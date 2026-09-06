# Database Migrations

## What it does

`db-migrations` guides incremental schema upgrades while preserving existing
records and application compatibility. It covers immutable migration history,
checksum validation, concurrent execution, and recovery from partial failures.

## When to reach for it

The skill is selected automatically when designing, implementing, or reviewing
schema upgrades, migration runners, or checksum failures. Legacy data transfers
and routine queries fall outside its scope.

## It's working if

Existing databases upgrade without losing retained data or breaking supported
consumers. Applied history matches the migration files, reruns skip validated
changes, and integrity errors stop execution before pending migrations run.
Verification distinguishes static review from isolated database execution.

## Where it fits

This toolkit skill uses the project's approved database engine and migration
tooling and its existing history mechanism, without adding duplicate tracking.
It complements `db-naming`, which supplies database object naming
conventions, and keeps schema snapshots distinct from incremental upgrades.
Install `db-naming` alongside it when selecting skills individually.
