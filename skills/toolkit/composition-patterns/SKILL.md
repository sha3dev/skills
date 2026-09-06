---
name: composition-patterns
description: Refactor React components when interacting modes or shared state make their APIs difficult to maintain; design reusable composition boundaries.
license: MIT
metadata:
  author: vercel
  version: '1.0.0'
  source: https://github.com/vercel-labs/agent-skills/tree/main/skills/composition-patterns
  source-revision: a5343bd997c4cc4d8bf2ca61021bdc74b4d6c9d5
  modified: Adapted for this repository's naming, automatic invocation, and progressive disclosure.
---

# React Composition Patterns

Use composition when interacting modes or shared state make a component hard to
understand. Keep ordinary boolean state props and simple components when they
remain clear. A provider, compound component, or variant must remove a concrete
problem; do not introduce one merely to follow a pattern.

Read only the rule relevant to the current design:

- Interacting behavior modes: [Boolean props](rules/architecture-avoid-boolean-props.md).
- Complex components with independently composed parts: [Compound components](rules/architecture-compound-components.md).
- Shared state ownership: [Lift state](rules/state-lift-state.md).
- Interchangeable state implementations: [Decouple implementation](rules/state-decouple-implementation.md) and [Context interface](rules/state-context-interface.md).
- Distinct supported modes: [Explicit variants](rules/patterns-explicit-variants.md).
- Content slots: [Children and render props](rules/patterns-children-over-render-props.md).
- React 19 ref or context API decisions: [React 19](rules/react19-no-forwardref.md).

Examples illustrate tradeoffs, not required rewrites. Preserve working APIs and
the project's React version; use props or local state when sufficient.
