---
name: frameworks-express
version: 1.0.0
description: Express.js middleware pipelines, routing controllers, error-handling middleware, and security (Helmet).
category: frameworks
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - shell_execute
---

# Express.js Server & Middleware Architecture

## Purpose
Guide Express.js APIs: middleware ordering, centralized error handling, and security hardening.

## When to Activate
Activate when developing Express.js applications (*.js, *.ts using express).

## Required Tools
- `read_file`

## Optional Tools
- `shell_execute`

## Inputs
Express app definitions, router controllers, middleware.

## Preconditions
Express package installed in dependencies.

## Procedure
1. Inspect middleware pipeline ordering: body parsers -> auth -> routers -> error handlers.
2. Verify that security headers are enabled via helmet middleware.
3. Ensure CORS policies are explicitly scoped rather than wildcard (*).
4. Verify centralized error handling middleware: (err, req, res, next) is defined last.
5. Test routes using supertest or HTTP client.

## Tool Usage
Use read_file to inspect routes; shell_execute for supertest.

## Safety
Never omit the error-handling middleware; prevent unhandled exceptions from crashing server.

## Permissions
Safe convention guidelines.

## Verification
Confirm supertest suite executes with 100% assertions passing.

## Failure Handling
If route hangs indefinitely, check if next() or res.send() was missed.

## Output Contract
ExpressAuditResult with middlewareCount, securityHardened: boolean, testStatus.

## Examples
Adding centralized error handling middleware to an Express REST API.

## Related Skills
- `frameworks-nodejs`
- `network-api`
