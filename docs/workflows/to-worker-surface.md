# To Worker Surface

## What it does

`to-worker-surface` turns a worker responsibility into concise visual documentation:
what each process does, when it runs or which event triggers it, and how its
configuration affects behavior. Highlighted parameter references show catalog
defaults and link to a section explaining every setting. No simulation or
execution controls are included. Typography, colors, and page styling follow
the API surface documentation.

## When to reach for it

Use it after `setup` to design, resume, or explicitly revise a worker contract.
It suits periodic tasks and event-driven processes whose behavior needs approval
before runtime implementation. It can also document an existing worker using a
separate review entry point without starting its background tasks.

## Prerequisites

An initialized project must declare a `worker` application with `worker-surface`.
Install `setup`, `workflow-run`, `interview`, `typescript-stack`, and
`frontend-design` alongside this skill. Browser automation must be available.
Existing projects need worker-aware generated state tools; updating installed
skills alone does not update `.flow/tools/`.

## It's working if

A reader can quickly understand each process and setting. Descriptions are short,
configuration names remain unchanged, parameter values come from one typed catalog, and all details are visible without
opening panels. The page shows defaults, never live secrets. Desktop and mobile
review, workspace tests, and the repository gate pass before user approval.
Decisions remain resumable in the application's `surface.md`.

## Where it fits

`setup` declares the worker; `flow` selects its surface workflow. `interview`
resolves behavior and configuration, while `workflow-run` owns shared run rules.
The deliverable is an approved contract and a local review page. Scheduling,
event handling, and real integrations require separately scoped implementation.
