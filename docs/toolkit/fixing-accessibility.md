# Fixing Accessibility

## What it does

`fixing-accessibility` audits and fixes targeted interface accessibility issues:
accessible names, native semantics, keyboard access, focus and dialog behavior,
forms and errors, announcements, contrast, media, and reduced motion.

It favors native HTML and small code-level corrections over unrelated rewrites
or unnecessary ARIA.

## When to reach for it

The skill is selected automatically when interactive controls, forms, dialogs,
menus, keyboard behavior, focus management, validation, or icon-only actions are
added or changed. It also applies when an accessibility review is explicitly
requested.

## It's working if

- Interactive controls have meaningful accessible names and keyboard behavior.
- Focus remains visible, predictable, and correctly managed around overlays.
- Form errors and state changes are associated with and announced to users.
- Fixes use native semantics where possible and remain narrowly scoped.

## Where it fits

`fixing-accessibility` provides semantic and interaction safeguards alongside
`frontend-design`, `composition-patterns`, and `shadcn`. It is a focused code
review and repair aid rather than a claim of complete standards certification.
This skill is adapted from
[ibelick/ui-skills](https://github.com/ibelick/ui-skills/tree/main/skills/fixing-accessibility).
