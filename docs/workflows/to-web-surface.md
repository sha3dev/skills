# To Web Surface

## What it does

`to-web-surface` turns a fuzzy UI into an agreed specification and then a
disconnected React/Vite interface for one `web` application. It maintains the
resumable specification at `.flow/applications/<application-slug>/surface.md`
and builds the confirmed interface in the application workspace, with source
under `<application.path>/src/`, one visible increment at a time.
`.flow/project.json` remains the progress tracker.
Shared deterministic domain records live under `.flow/fixtures/` and reach the
interface through a replaceable local data-access boundary.

## When to reach for it

Invoke it after `setup` to specify, build, or resume the surface of a `web`
application. Invoke it on a completed surface only when explicitly revising it.

## Prerequisites

`setup` must have generated a valid `.flow/project.json` and toolchain, the
application must declare a `web-surface` phase, and the `interview` and
`fixtures` toolkit skills must be available.

The workflow verifies the toolchain once on entry and installs dependencies when
they are missing, so a fresh clone does not read as a broken repository.
Increments use `npm run check:code`; the final `npm run check` repeats toolchain
verification as part of the complete gate.

## It's working if

The operator can resume from `surface.md`, receives one short UI decision at a
time with a useful recommendation, and approves the specification before code
is written. Different surfaces can reuse and extend the same stable fixture
records without introducing mock-prefixed domain types into the web
application. Each implementation turn produces a runnable, reviewed increment at
the same preview URL, which one development server serves through hot module
replacement for the whole workflow and releases when the workflow ends. An
increment may leave a component the interface does not render yet without the
checks demanding its deletion. If browser tooling is unavailable, visual
verification remains pending until the user confirms desktop and mobile
behavior from the preview URL. The phase completes only after approval of the
whole interface, a green full `npm run check`, and a successful production
build of its workspace.

## Where it fits

`setup` defines applications and progress. `interview` supplies the reusable
decision discipline, and `fixtures` owns the shared example-data contract.
`to-web-surface` applies both to a web UI; other surface flows can apply the same
toolkit skills to their own decision spaces and artifacts.
