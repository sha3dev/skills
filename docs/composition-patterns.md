# Composition Patterns

## What it does

`composition-patterns` provides focused React patterns for reusable component
APIs. It replaces proliferating boolean modes with explicit variants or compound
components, and separates shared state interfaces from their implementation.

Detailed rules include incorrect and corrected examples for component
architecture, state ownership, composition, and relevant React 19 APIs.

## When to reach for it

The skill is selected automatically when designing a reusable component API,
building a component library, introducing compound components or providers, or
refactoring components whose boolean props and modes no longer scale. It is not
a blanket style guide for ordinary React components.

## It's working if

- Call sites express intent through composition or explicit variants.
- Shared state is owned once and exposed through a stable interface.
- Consumers can extend a component without adding combinations of mode flags.
- React-version-specific guidance is applied only to compatible projects.

## Where it fits

`composition-patterns` complements `frontend-design`: one owns reusable React
APIs while the other owns visual direction. It can govern components sourced
through `shadcn` when their local composition is being extended. This skill is
adapted from
[Vercel's composition patterns](https://github.com/vercel-labs/agent-skills/tree/main/skills/composition-patterns).
