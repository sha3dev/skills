# Database Naming

## What it does

`db-naming` keeps relational schema identifiers consistent across tables,
columns, keys, constraints, and indexes. It also clarifies the role of canonical
SQL so current schema definitions, reference data, and upgrade steps remain
understandable and maintainable.

## When to reach for it

The skill is selected automatically when designing or reviewing relational
schemas or implementing approved schema changes. Routine queries that leave
the schema unchanged do not need it. A review can identify naming conflicts;
applying schema changes requires authorization within the task.

## It's working if

Names communicate ownership and relationship roles, table prefixes stay stable
and unique, and database identifiers agree with their consumers. Canonical SQL
can recreate the intended schema, while existing databases retain an explicit
upgrade path. Verification reports distinguish static review from database
execution.

## Where it fits

This toolkit skill supports approved database work using the project's chosen
engine, schema tooling, and source of truth. Product requirements determine the
data model; `db-naming` supplies naming and SQL organization conventions for
that model. It complements `rest-api-design`, which governs the public HTTP
contract.
