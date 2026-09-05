---
name: frontend-design
description: Choose a visual direction for new UI or an explicitly requested redesign, and evolve existing UI consistently with its approved design. Use for visual composition, typography, palette, and layout decisions, not routine nonvisual code changes.
license: Complete terms in LICENSE.txt
metadata:
  author: anthropic
  source: https://github.com/anthropics/skills/tree/main/skills/frontend-design
  source-revision: 2235be7c60b551f5de82ade908fd3816455afcda
  modified: Adapted for scoped invocation, approved-design reuse, and proportional design work.
---

# Frontend Design

Make visual decisions serve the actual subject, audience, and task. Follow the
user's brief and the consuming workflow's confirmed product decisions.

## Choose the scope

For an existing interface, inspect the relevant screen, shared components, and
design tokens. Reuse its approved typography, palette, spacing, and interaction
patterns. Make the requested change fit; do not restart visual exploration or
invent a new signature element for routine evolution.

For a new surface or requested redesign, resolve missing product decisions
through the consuming workflow. Propose a compact direction covering color,
type, layout, and any distinctive element that helps the content. Compare
alternatives only when a meaningful choice remains. Check the direction against
the brief before building; do not require novelty or aesthetic risk for its own
sake. Internal tools and API review pages can use restrained existing templates.

## Design and implementation

- Use the subject's real content and domain language. Layout and hierarchy
  should make the main task obvious; numbering and visual structure must encode
  actual meaning.
- Choose a readable type scale and a coherent palette. Derive styles from shared
  tokens and existing variants rather than unrelated per-screen values.
- Add motion only when it improves feedback or understanding. Respect reduced
  motion, keyboard focus, accessible names, and mobile layouts.
- Match implementation complexity to the approved direction. Reuse components
  and native HTML/CSS; avoid decoration or interaction that hides needed content.
- Write from the user's perspective: concrete action labels, consistent names,
  useful empty states, and errors that explain recovery. Keep implementation
  terminology out of product copy unless the audience needs it.

## Review

Use the consuming workflow's browser and completion checks. Inspect the changed
visual result and interactions; correct concrete problems in hierarchy,
readability, responsiveness, accessibility, and consistency. Stop when the
approved direction and review criteria are met. Do not run a second aesthetic
exploration or duplicate a completed browser pass without a relevant change.
