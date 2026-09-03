# To Web Surface

## What it does

`to-web-surface` turns a fuzzy UI into an agreed specification and then a
disconnected React/Vite interface for one `web` application. It maintains the
resumable specification at `<application.path>/SURFACE.md` and builds the
confirmed interface in `<application.path>/surface/`, one visible increment at
a time. `PROJECT.md` remains the progress tracker.

## When to reach for it

Invoke it after `setup` to specify, build, or resume the surface of a `web`
application. Invoke it on a completed surface only when explicitly revising it.

## Prerequisites

`setup` must have generated a valid `PROJECT.md` and toolchain, the application
must declare a `web-surface` phase, and the `interview` toolkit skill must be
available.

The workflow verifies the toolchain once on entry and installs dependencies when
they are missing, so a fresh clone does not read as a broken repository. After
that, increments reach the toolchain through `npm run check`.

## It's working if

The operator can resume from `SURFACE.md`, receives one short UI decision at a
time with a useful recommendation, and approves the specification before code
is written. Each implementation turn produces a runnable, reviewed increment at
the same preview URL, which one development server serves through hot module
replacement for the whole workflow and releases when the workflow ends. The
phase completes only after approval of the whole interface.

## Where it fits

`setup` defines applications and progress. `interview` supplies the reusable
decision discipline. `to-web-surface` applies it to a web UI; other surface
flows can apply the same toolkit to their own decision spaces and artifacts.
