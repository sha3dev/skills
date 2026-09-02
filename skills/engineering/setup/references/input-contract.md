# Setup input contract

Create technical English JSON with this shape:

```json
{
  "title": "Project title",
  "definition": [
    "Definition statement one.",
    "Definition statement two.",
    "Definition statement three.",
    "Definition statement four."
  ],
  "blocks": [
    {
      "name": "Editorial CMS",
      "responsibility": "One concise responsibility.",
      "ownership": "repository",
      "type": "web",
      "folder": "editorial-cms",
      "contents": ["High-level area contained in this block."],
      "readWhen": ["When an agent should inspect this folder."]
    },
    {
      "name": "Identity Provider",
      "responsibility": "One concise responsibility.",
      "ownership": "external"
    }
  ],
  "relationships": [
    {
      "from": "Editorial CMS",
      "to": "Identity Provider",
      "description": "Authenticates editorial users."
    }
  ]
}
```

Provide four or five concise definition statements; the generator joins them into one paragraph. Include at least one repository-owned block. Block names are unique and are the exact references used by relationships.

Repository-owned blocks require every shown field, one of the exact types `web`, `api`, or `worker`, a unique kebab-case folder name under `src/`, and non-empty `contents` and `readWhen` lists. Do not combine types in one block. External blocks use only `name`, `responsibility`, and `ownership` and never create a folder.

`relationships` is required and may be empty. `from` is the block that initiates the logical interaction; `to` receives it. Both values must exactly match declared block names. `description` states the interaction's purpose in one concise sentence. Use at most one relationship for each directed `from`/`to` pair; combine multiple purposes in its description.

Do not add implementation details, infrastructure choices, acceptance criteria, placeholders, or fields outside this contract. The input file is temporary and must live outside the repository. The generated Markdown documents, not this JSON, become the permanent source of truth.
