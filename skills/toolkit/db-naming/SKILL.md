---
name: db-naming
description: Apply database naming conventions to tables, columns, keys, constraints, indexes, and canonical SQL. Use when designing or reviewing relational schemas or implementing approved schema changes; not for routine queries that leave the schema unchanged.
---

# Database naming and canonical SQL

Read the affected product specification, schema definitions, prefix registry,
and direct consumers before proposing names. Use the approved database engine
and repository tooling; this skill does not select a database, ORM, key type,
or schema deployment mechanism.

Apply these conventions to new objects. For existing objects, identify naming
conflicts and dependent queries, mappings, views, and public contracts before
renaming. A naming review alone does not authorize schema changes. Keep repairs
within the requested scope; do not turn a local change into a schema-wide rename.

## Identifiers

- Use singular, technical-English table names in lowercase `snake_case`.
  Join-table names describe the relationship, such as `agency_property`.
- Give each table a stable, unique three-letter uppercase prefix. Reuse the
  existing registry; choose meaningful letters and resolve collisions there
  before adding columns. Do not regenerate a prefix from each occurrence of a name.
- Name owned columns `<PREFIX>_<snake_case_name>`, including `<PREFIX>_id`
  for a single-column surrogate primary key when the model calls for one.
  Naming does not require a surrogate key or additional bookkeeping columns.
- Foreign-key columns use the referenced table's prefix and key name. For multiple
  references to the same table, add a lowercase role before that identifier:
  `source_PRP_id`, `target_PRP_id`. Apply the same rule to self-references.
  For composite foreign keys, preserve the correspondence with each referenced
  key column and apply the role consistently to the group.
- Boolean names use `is_` after the owning prefix: `PRP_is_archived`.
- Date/time names end in `_at`: `PRP_created_at`, `PRP_published_at`.
  Choose date, timestamp, and time-zone semantics from the product requirements;
  the suffix does not determine the storage type. Durations use explicit units,
  such as `PRP_duration_seconds`.
- Quote mixed-case column identifiers consistently in DDL and queries using the
  approved engine's syntax. In PostgreSQL, use double quotes: `"PRP_id"` and
  `"source_PRP_id"`. Verify ORM mappings preserve the exact database identifiers.
- Keep other database-object names lowercase `snake_case`. Avoid reserved words
  and ambiguous abbreviations beyond the registered prefixes.

Maintain one prefix registry alongside the schema documentation, with table name,
prefix, and schema namespace when applicable. If none exists, add the small table
when defining the first approved schema; do not populate it with hypothetical entities.

## Constraints and indexes

Name constraints explicitly. In the patterns below, `<columns>` means the full
column identifiers lowercased and joined with underscores in declared order.

| Object | Pattern | Example |
| --- | --- | --- |
| Primary key | `pk_<table>` | `pk_property` |
| Foreign key | `fk_<table>_<columns>` | `fk_property_agn_id` |
| Unique constraint | `uq_<table>_<columns>` | `uq_property_prp_external_id` |
| Check constraint | `ck_<table>_<rule>` | `ck_property_price_nonnegative` |
| Index | `idx_<table>_<columns>` | `idx_property_prp_published_at` |

For expression or partial indexes, use a short purpose suffix that distinguishes
the expression or predicate. Respect the engine's identifier limits and naming
scope; shorten long names deterministically and check for collisions rather than
relying on silent truncation. Follow an existing shortening convention if present.
Do not add redundant indexes merely to satisfy a name pattern; inspect indexes
already supplied by primary-key or unique constraints.

## Canonical SQL

Follow the repository's established schema source of truth. When canonical SQL
is used, separate complete current-state DDL (`sql/schema/`), configuration and
reference data (`sql/data/`), and runtime queries (`sql/queries/`). Keep this
layout unless an existing approved layout serves the same purpose.

- Prepare the definition in the repository and verify it in an isolated database
  before any authorized operational application. Never use production as a
  schema-development workspace.
- Keep canonical definitions capable of creating the intended database from
  empty, in explicit dependency order. Keep runtime queries out of schema runners.
- Canonical SQL describes the resulting state. If upgrades need transitional
  `ALTER` or `DROP` statements, retain them in the established migration or
  operational mechanism, separate from the snapshot. Do not remove required
  migration history or imply that a snapshot upgrades existing databases.
- If a runner promises repeatability, use engine-supported guards or replacement
  constructs and conflict-aware reference-data inserts as appropriate. Existence
  checks alone do not reconcile a changed definition; verify the resulting schema.
- Keep private customer records and secrets out of reference data. Add table and
  column comments for non-obvious domain meaning, units, or invariants.

## Verification

For naming-only proposals, check prefix uniqueness, role clarity, identifier
lengths, and consistency with the affected schema and consumers. For implemented
DDL, use the repository's isolated database checks to verify object names,
relationships, and meaningful constraint behavior with synthetic data. Verify
empty-database creation for changed canonical SQL; verify upgrades and reruns
only where the affected mechanism promises them. Report what was checked and
what remains unverified without treating static review as database execution.
