---
name: fixtures
description: Create and evolve deterministic shared fixture records when disconnected application surfaces need representative domain data that later surfaces must reuse.
---

# Fixtures

Maintain the project's shared example domain records under `.flow/fixtures/`.
They are an evolving cross-surface artifact: the first consumer creates the
minimum known record, and later consumers extend that same record as they learn
more about the domain. They are not an application-specific mock layer or a
production persistence design.

## Data contract

- Use one plural kebab-case JSON file per entity collection. Each file contains
  an array of objects with a non-empty string `id` unique within that file.
- Read all relevant existing collections before changing one. Preserve stable
  identifiers, established values, and relationships; extend existing records
  instead of creating equivalent records for another application.
- Store domain facts only. Keep visual state such as selection and expansion in
  the web application, and keep transport envelopes such as pagination metadata
  in the API application.
- Use fixed, plausible, fictional values. Every fixture and field must be
  non-sensitive and safe to expose to a browser. Never copy production or
  customer data, credentials, tokens, secrets, or other private information.
  Do not derive identifiers, dates, ordering, or content from randomness or the
  current time.
- Add only the records, variants, and fields needed by a confirmed surface or
  meaningful state. Keep relationships explicit through stable identifiers.

## Application boundary

Applications use production-facing domain names from the start: `User`,
`UserRepository`, and `users`, never `MockUser`, `MockUserRepository`, or
`mockUsers`. Centralize fixture access in a replaceable infrastructure adapter;
components and domain logic must not read `.flow/fixtures/` directly.

A disconnected web surface can implement a domain repository with fixture data.
A later API surface reads and extends the same records, mapping them into its
own response contract. Connecting the web surface replaces its local repository
composition with the HTTP implementation without renaming domain types or
rewriting components.

## Validation

After changing fixtures, run `npm run check:fixtures` when the initialized
repository provides it. In repositories created by an older setup version,
parse every fixture file, check the collection and identifier contract above,
and inspect affected references before continuing. Application type checks and
builds remain responsible for validating each consumer's mapping.
