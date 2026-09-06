---
name: fastify-best-practices
description: Implement or review routes, plugins, schemas, and lifecycle behavior in an existing Fastify application. Load integrations or deployment guidance only for that work.
metadata:
  tags: fastify, nodejs, typescript, backend, api, server, http
  modified: Adapted to preserve the consuming project's runtime and toolchain.
---

# Fastify

Use the project's existing runtime, configuration, and dependencies. Introduce a
plugin, layer, or service only for a concrete requirement; examples are options,
not a mandatory architecture. Preserve simpler solutions that already satisfy
validation, lifecycle, and ownership needs.

Read only the matching rule below. Follow related rules when a concrete
dependency or unresolved question requires them, not a preset reading sequence.

## How to use

Read individual rule files for detailed explanations and code examples:

- [rules/plugins.md](rules/plugins.md) - Plugin development and encapsulation
- [rules/routes.md](rules/routes.md) - Route organization and handlers
- [rules/schemas.md](rules/schemas.md) - JSON Schema validation
- [rules/error-handling.md](rules/error-handling.md) - Error handling patterns
- [rules/hooks.md](rules/hooks.md) - Hooks and request lifecycle
- [rules/authentication.md](rules/authentication.md) - Authentication and authorization
- [rules/testing.md](rules/testing.md) - Testing with inject()
- [rules/performance.md](rules/performance.md) - Performance optimization
- [rules/logging.md](rules/logging.md) - Logging with Pino
- [rules/typescript.md](rules/typescript.md) - TypeScript integration
- [rules/decorators.md](rules/decorators.md) - Decorators and extensions
- [rules/content-type.md](rules/content-type.md) - Content type parsing
- [rules/serialization.md](rules/serialization.md) - Response serialization
- [rules/cors-security.md](rules/cors-security.md) - CORS and security headers
- [rules/websockets.md](rules/websockets.md) - WebSocket support
- [rules/database.md](rules/database.md) - Database integration patterns
- [rules/configuration.md](rules/configuration.md) - Application configuration
- [rules/deployment.md](rules/deployment.md) - Production deployment
- [rules/http-proxy.md](rules/http-proxy.md) - HTTP proxying and reply.from()
