# Lazy

## What it does

`lazy` forces coding work through a strict simplicity ladder. It first checks
whether a change is needed, then prefers deletion, reuse, the standard library,
native platform capabilities, and installed dependencies before introducing new
code, abstractions, or dependencies.

The goal is the smallest correct implementation, not code golf. The skill still
requires understanding the affected flow, finding the root cause, preserving
explicit scope, and leaving focused validation for non-trivial behavior.

## When to reach for it

Invoke `lazy` for a coding, debugging, refactoring, review, or design task where
you want the agent to actively resist over-engineering. It is user-invoked so
this stronger implementation style is applied only when explicitly requested.

## Boundaries

The skill never trades away security, trust-boundary validation, data-loss
protection, required error handling, accessibility, or necessary environment
calibration. It also does not silently discard explicit requirements.

Unless a detailed explanation is requested, its handoff remains short: what was
intentionally skipped and the condition that would justify adding it.

## It's working if

- The requested outcome is met with a small, understandable change.
- Existing code and platform capabilities are reused before new machinery is added.
- Any deliberate limitation has a concrete condition for revisiting it.

## Where it fits

`lazy` is a standalone, user-invoked engineering discipline. Apply it to any
coding task where unnecessary complexity is the main risk.
