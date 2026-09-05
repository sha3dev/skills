---
name: shadcn
description: "Add, compose, style, debug, or update shadcn/ui components in a project with components.json, or initialize shadcn and change presets when requested. Do not activate for unrelated work merely because the repository uses shadcn."
license: MIT; complete terms in LICENSE.txt
metadata:
  author: shadcn
  source: https://github.com/shadcn-ui/ui/tree/main/skills/shadcn
  source-revision: 503a3a57aec9a3817e37f90aa0817b1fabd284d0
  modified: Adapted for portable discovery, scoped invocation, and task-based reference loading.
---

# shadcn/ui

Components are project-owned source. Preserve local adaptations and the
established design system.

## Project context

Run `shadcn info --json` from the application workspace using its package runner:
`npx shadcn@latest`, `pnpm dlx shadcn@latest`, or `bunx --bun shadcn@latest`.
Reuse that result within the run until configuration or installed components
change. Use its actual aliases, resolved paths, primitive base, icon library,
framework, and Tailwind version; do not assume Radix, Lucide, Next.js, or `@/`.

Initialize only when requested; a React application alone does not justify
adding shadcn. Preserve the consuming project's scaffold and toolchain.

## Component work

1. Inspect the relevant installed components and their callers first. Reuse
   components and built-in variants before adding dependencies or custom markup.
2. Read only the rule files relevant to the change from the map below.
   For unfamiliar APIs, additions, upgrades, or unresolved behavior, run
   `shadcn docs <component...>` and fetch the relevant returned URLs. Batch
   related components and reuse documentation already verified in this run.
3. When a required component is absent, search the established registry before
   implementing it. Use the registry selected by the request, configuration,
   or installed item. Ask only if a material registry choice remains ambiguous.
   Use `shadcn add` for installation; do not re-add installed components.
4. Inspect added files for correct imports, composition, accessibility, and
   dependencies. Third-party files may retain aliases or icon imports that
   need adapting to the project. Verify the changed behavior.

Keep semantic color tokens, shared variants, accessible names, and the
project's composition conventions. Preserve required component structure such
as dialog titles, item groups, and tab lists. Do not add component sections,
providers, or wrappers when they serve no actual content or behavior.

## Task-specific references

Read the matching reference, not the whole collection:

- Forms, validation, and grouped inputs: [rules/forms.md](rules/forms.md).
- Groups, overlays, cards, loading, and feedback: [rules/composition.md](rules/composition.md).
- Custom triggers and primitive APIs: [rules/base-vs-radix.md](rules/base-vs-radix.md).
- Spacing, tokens, variants, and conditional classes: [rules/styling.md](rules/styling.md).
- Icons inside components: [rules/icons.md](rules/icons.md).
- Chat primitives and scrolling: [rules/chat.md](rules/chat.md), only for chat UI.
- Theme customization: [customization.md](customization.md).
- CLI options, initialization, upstream updates, or preset changes:
  [cli.md](cli.md). Preview overwrites and preserve local changes; proceed under
  existing explicit authorization and ask only when the intended overwrite
  scope is unresolved. Let the CLI decode and apply preset codes.
- Authoring a registry or resolving registry dependencies:
  [registry.md](registry.md).
