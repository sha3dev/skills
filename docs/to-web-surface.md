# To Web Surface

## What it does

`to-web-surface` builds the final disconnected interface for one `web`
application through a conversation with its operator. It creates an
independently runnable React/Vite workspace at `<application.path>/surface/`,
keeps a live preview available, and implements one visible increment at a time.

The application code is the deliverable. `PROJECT.md` is the sole progress
tracker; the workflow does not create a parallel planning artifact.

## When to reach for it

Invoke it after `setup` for an application whose type is `web`. Invoke it
again to resume an `in-progress` surface or explicitly revise an approved one.

## Prerequisites

`setup` must have generated a valid `PROJECT.md` and toolchain. The target
application must declare a `surface` phase.

## Incremental collaboration

The first increment normally establishes the application shell and global
navigation. Later increments add or refine one section, screen, state, or
interaction. After each increment, the agent keeps the application runnable,
checks the repository, and gives the operator the preview URL for feedback.

The interface may use local fixtures and client state to make interactions
realistic. It does not call APIs, add server behavior, persist data, or create
infrastructure.

The selected application runs independently with
`npm run dev --workspace <workspace-name>`. The repository-level `npm run dev`
uses Turborepo when several materialized applications need to run together.

## Progress

The workflow changes the selected application from `surface: pending` to
`surface: in-progress` when implementation starts. Only explicit operator
approval and a green repository check permit `surface: complete`.

## It's working if

The operator can repeatedly inspect and discuss a running interface, each turn
produces a focused visible improvement, and the approved application is recorded
as `surface: complete` without another tracking document.

## Where it fits

`setup` defines the applications and initializes their progress.
`to-web-surface` materializes one web application. Future API and worker surface
workflows will use the same progress model.
