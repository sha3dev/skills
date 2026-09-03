# shadcn

## What it does

`shadcn` uses the official CLI to inspect a project's actual configuration,
search configured registries, retrieve current component documentation, add or
preview components, apply presets, and preserve local changes during updates.

Its component guidance follows the detected framework, package manager, base,
style, icon library, aliases, Tailwind version, and resolved paths rather than
assuming defaults. It supports both Vite and Next.js projects.

## When to reach for it

The skill is selected automatically for work in a project containing
`components.json`, or when the user explicitly asks for shadcn components,
registries, initialization, presets, debugging, or updates. Generic React work
does not activate it.

## Prerequisites

Existing projects need a valid `components.json`. Creating or initializing a
shadcn project must be explicitly requested. The project package runner needs
network access to execute the current shadcn CLI and retrieve component docs.

## It's working if

- CLI decisions come from `shadcn info --json` in the correct application workspace.
- Existing components and live documentation are checked before code is added.
- Updates are previewed with `--dry-run` and `--diff`, preserving local changes.
- Generated imports, primitives, icons, tokens, and paths match the detected project.

## Where it fits

`shadcn` owns component-library and registry mechanics. `frontend-design` still
owns the product's visual direction, `composition-patterns` owns reusable React
APIs, and `fixing-accessibility` owns targeted accessibility review. This skill
is adapted from the
[official shadcn skill](https://github.com/shadcn-ui/ui/tree/main/skills/shadcn).
