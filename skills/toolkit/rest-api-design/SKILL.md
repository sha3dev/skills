---
name: rest-api-design
description: Shape a resource-oriented HTTP contract before it is implemented. Use when naming resources, choosing methods and paths, defining request and response representations, selecting status codes, or designing filtering, ordering, and pagination for a REST API.
license: MIT; complete terms in LICENSE.txt
metadata:
  author: AJ Geddes
  source: https://github.com/aj-geddes/useful-ai-prompts/tree/main/skills/rest-api-design
  source-revision: cf2b16f5db89294720543eb5190e7bd3f9e22f64
---

# REST API Design

Design REST APIs that are intuitive, consistent, and resource-oriented. This
skill covers the shape of the contract, not its implementation; framework
guidance owns the latter.

## When to use

- Naming resources and collections
- Choosing HTTP methods and paths for operations
- Defining request and response representations
- Selecting status codes for success, client errors, and server errors
- Designing filtering, ordering, and pagination

## Quick start

```
✅ Good Resource Names (Nouns, Plural)
GET    /api/users
GET    /api/users/123
GET    /api/users/123/orders
POST   /api/products
DELETE /api/products/456

❌ Bad Resource Names (Verbs, Inconsistent)
GET    /api/getUsers
POST   /api/createProduct
GET    /api/user/123  (inconsistent singular/plural)
```

## Reference guides

Read only the file whose subject the current decision touches.

| Guide | Contents |
| --- | --- |
| [Resource naming](references/resource-naming.md) | Resource names, HTTP methods, nested resources |
| [Request examples](references/request-examples.md) | Creating and updating a resource |
| [Query parameters](references/query-parameters.md) | Filtering, sorting, pagination, field selection, search |
| [Response formats](references/response-formats.md) | Success, paginated collection, and error envelopes |
| [HTTP status codes](references/http-status-codes.md) | Status code selection and API versioning |

## Best practices

### ✅ DO

- Use nouns for resources, not verbs
- Use plural names for collections
- Be consistent with naming conventions
- Return appropriate HTTP status codes
- Include pagination for collections
- Provide filtering and sorting options
- Document thoroughly with OpenAPI
- Provide clear error messages
- Use ISO 8601 for dates

### ❌ DON'T

- Use verbs in endpoint names
- Return 200 for errors
- Expose internal IDs unnecessarily
- Over-nest resources (max 2 levels)
- Use inconsistent naming
- Return sensitive data
- Break backward compatibility without versioning
