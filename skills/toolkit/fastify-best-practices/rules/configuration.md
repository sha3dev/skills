---
name: configuration
description: Application configuration in Fastify using env-schema
metadata:
  tags: configuration, environment, env, settings, env-schema
---

# Application Configuration

## Contents

- [Use env-schema for Configuration](#use-env-schema-for-configuration)
- [Configuration as Plugin](#configuration-as-plugin)
- [Secrets Management](#secrets-management)
- [Feature Flags](#feature-flags)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
- [Dynamic Configuration](#dynamic-configuration)

## Use env-schema for Configuration

Validate required environment values at startup using the established mechanism.
`env-schema` is an option when JSON Schema validation is useful; do not add it
solely to replace adequate existing validation. The examples below are optional.

```typescript
import Fastify from 'fastify';
import envSchema from 'env-schema';
import { Type, type Static } from '@sinclair/typebox';

const schema = Type.Object({
  PORT: Type.Number({ default: 3000 }),
  HOST: Type.String({ default: '0.0.0.0' }),
  DATABASE_URL: Type.String(),
  JWT_SECRET: Type.String({ minLength: 32 }),
  LOG_LEVEL: Type.Union([
    Type.Literal('trace'),
    Type.Literal('debug'),
    Type.Literal('info'),
    Type.Literal('warn'),
    Type.Literal('error'),
    Type.Literal('fatal'),
  ], { default: 'info' }),
});

type Config = Static<typeof schema>;

const config = envSchema<Config>({
  schema,
  dotenv: true, // Load from .env file
});

const app = Fastify({
  logger: { level: config.LOG_LEVEL },
});

app.decorate('config', config);

declare module 'fastify' {
  interface FastifyInstance {
    config: Config;
  }
}

await app.listen({ port: config.PORT, host: config.HOST });
```

## Configuration as Plugin

Encapsulate configuration in a plugin for reuse:

```typescript
import fp from 'fastify-plugin';
import envSchema from 'env-schema';
import { Type, type Static } from '@sinclair/typebox';

const schema = Type.Object({
  PORT: Type.Number({ default: 3000 }),
  HOST: Type.String({ default: '0.0.0.0' }),
  DATABASE_URL: Type.String(),
  JWT_SECRET: Type.String({ minLength: 32 }),
  LOG_LEVEL: Type.String({ default: 'info' }),
});

type Config = Static<typeof schema>;

declare module 'fastify' {
  interface FastifyInstance {
    config: Config;
  }
}

export default fp(async function configPlugin(fastify) {
  const config = envSchema<Config>({
    schema,
    dotenv: true,
  });

  fastify.decorate('config', config);
}, {
  name: 'config',
});
```

## Secrets Management

Handle secrets securely:

```typescript
// Never log secrets
const app = Fastify({
  logger: {
    level: config.LOG_LEVEL,
    redact: ['req.headers.authorization', '*.password', '*.secret', '*.apiKey'],
  },
});

// For production, use secret managers (AWS Secrets Manager, Vault, etc.)
// Pass secrets through environment variables - never commit them
```

## Feature Flags

Implement feature flags via environment variables:

```typescript
import { Type, type Static } from '@sinclair/typebox';

const schema = Type.Object({
  // ... other config
  FEATURE_NEW_DASHBOARD: Type.Boolean({ default: false }),
  FEATURE_BETA_API: Type.Boolean({ default: false }),
});

type Config = Static<typeof schema>;

const config = envSchema<Config>({ schema, dotenv: true });

// Use in routes
app.get('/dashboard', async (request) => {
  if (app.config.FEATURE_NEW_DASHBOARD) {
    return { version: 'v2', data: await getNewDashboardData() };
  }
  return { version: 'v1', data: await getOldDashboardData() };
});
```

## Anti-Patterns to Avoid

Keep deployment-specific values and secrets out of tracked configuration. Reuse
safe static configuration and the existing environment-loading mechanism. Prefer
explicit environment variables when a deployment needs independent controls;
do not replace ordinary `NODE_ENV` behavior or add feature flags without a need.

## Dynamic Configuration

Only when configuration must change without restart, use the approved dynamic
configuration mechanism. The following illustrates an external source; do not
add a service or polling loop for ordinary startup configuration:

```typescript
interface DynamicConfig {
  rateLimit: number;
  maintenanceMode: boolean;
}

let dynamicConfig: DynamicConfig = {
  rateLimit: 100,
  maintenanceMode: false,
};

async function refreshConfig() {
  try {
    const newConfig = await fetchConfigFromService();
    dynamicConfig = newConfig;
    app.log.info('Configuration refreshed');
  } catch (error) {
    app.log.error({ err: error }, 'Failed to refresh configuration');
  }
}

// Refresh periodically
setInterval(refreshConfig, 60000);

// Use in hooks
app.addHook('onRequest', async (request, reply) => {
  if (dynamicConfig.maintenanceMode && !request.url.startsWith('/health')) {
    reply.code(503).send({ error: 'Service under maintenance' });
  }
});
```
