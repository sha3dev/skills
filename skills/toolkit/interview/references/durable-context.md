# Durable context

Maintain the minimum current context needed to resume without chat history.
These rules cover narrative documents, not executable contracts, structured
state, datasets, or required audit and migration history.

## Entry point and selective reading

Keep purpose, scope, shared constraints, approval state, and open decisions in
the main document. Read it first, then follow references only for the current
task or a concrete dependency. Each reference explains its contents and when to
read it.

When substantial detail has an independent reading scope, move it into an
optional matching directory: `surface.md` → `surface/checkout.md`, or
`connect.md` → `connect/orders.md`. Use relative Markdown links and descriptive
names; create only populated files, with deeper grouping only when useful.
Keep each decision in one authoritative location. Link to existing code,
fixtures, and contracts instead of copying them, but retain requirements until
those sources actually capture them. Implementation does not establish approval.

## Maintenance

On resume, after decisions change, and before handoff, update affected sections
in place. Merge duplicates, state shared rules once, and remove superseded
content, answered questions, and implementation diaries. Keep rejected options
only as lasting constraints. Retain concise unresolved blockers and useful
verification references; discard accumulated command logs.

Aim for roughly 1,500 words or fewer per document as an editorial guideline,
not a model limit or a target to fill. Condense or split when context becomes
unwieldy; preserve essential requirements over the word budget. Apply this to
the entry point and affected subdocuments without scanning unrelated detail.

Check edited or moved content for lost decisions, exclusions, open issues,
approval scope, and broken references. Keep shared constraints and open-decision
summaries visible in the entry point. Editorial changes need no renewed approval;
changes in meaning follow the owning workflow's decision rules.
