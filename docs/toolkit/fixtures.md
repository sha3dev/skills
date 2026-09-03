# Fixtures

## What it does

`fixtures` maintains deterministic example domain records under
`.flow/fixtures/`. Records begin with the fields required by the first surface
and are extended in place as later surfaces discover additional domain data.
All values are fictional, non-sensitive, and safe for client-side exposure.
The files are immutable initial state at runtime; applications may clone them
into memory for temporary writes but never persist interactions back into the
shared records.

## When to reach for it

Use it when a disconnected application surface needs representative data, or
when another surface needs to reuse and enrich records that already exist. It
is unnecessary for purely visual state or transport-only response metadata.

## It's working if

Different application surfaces refer to the same stable entities and
relationships, later work extends rather than duplicates those records, and
application code uses production-facing domain names behind a replaceable data
access boundary. Runtime writes remain observable for the current page or
server lifetime and reset from fixtures on reload or restart.

## Where it fits

`fixtures` is a model-invoked toolkit skill shared by surface workflows.
`to-web-surface` and `to-api-surface` use it for disconnected data; later
integration work can enrich the same records and replace local data access
without reshaping the interface.
