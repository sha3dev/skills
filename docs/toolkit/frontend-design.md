# Frontend Design

## What it does

`frontend-design` gives new or substantially reshaped interfaces a deliberate
visual identity grounded in their subject, audience, and purpose. It develops a
compact direction for color, typography, layout, and copy. Existing interfaces
reuse their approved direction; routine evolution does not restart exploration.

The skill also preserves a quality floor for responsive behavior, keyboard
focus, reduced motion, and visual inspection without turning those requirements
into a generic aesthetic.

## When to reach for it

The skill is selected automatically when creating a new interface or making a
material visual redesign, or when extending an existing interface requires visual
composition decisions. Nonvisual fixes do not activate it.

## It's working if

- The interface is recognizably specific to its real subject and audience.
- Typography, color, structure, motion, and copy follow one coherent direction.
- The first increment looks polished, with components adapted to that direction.
- Distinctive elements serve the brief; internal review tools can reuse restrained templates.
- The rendered result survives responsive and accessibility checks.

## Where it fits

`frontend-design` supplies visual direction to workflows such as
`to-web-surface`; it does not choose the application framework or component
library. When shadcn is already part of the project, `shadcn` owns its component
and CLI mechanics. This skill is adapted from
[Anthropic's frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design).
