# Fastify Best Practices

## What it does

`fastify-best-practices` provides detailed upstream guidance for Fastify
servers: plugin encapsulation, routes, schemas, serialization, errors, hooks,
testing, security, configuration, databases, deployment, and related runtime
concerns. Its focused rule files are loaded only when their subject is relevant.

## When to reach for it

The skill is selected automatically when building, configuring, reviewing, or
debugging a Fastify server or REST API. It is not a general Node.js or HTTP
architecture guide for applications that do not use Fastify.

## It's working if

Fastify code uses the framework's lifecycle and encapsulation deliberately,
validates and serializes contracts with schemas, keeps application construction
testable, and verifies routes through HTTP injection rather than direct handler
calls.

## Where it fits

`to-api-surface` owns the product interview, durable contract, fixture-backed
runtime, increments, and approval boundary. `connect-to-api` owns the later
integration scope and lifecycle, including when browser-origin configuration is
needed. `fastify-best-practices` supplies the framework expertise within those
workflow boundaries. The skill is an unchanged copy of Matteo Collina's
[Fastify skill](https://github.com/mcollina/skills/tree/main/skills/fastify),
revision `856efd268ae85482d882f3d0bed869fd020b5c06`, distributed under its
included MIT license.
