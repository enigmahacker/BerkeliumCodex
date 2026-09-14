---
name: infrastructure-deployment
version: 1.0.0
description: Plans, validates, and coordinates application deployments to cloud, serverless, or edge targets.
category: infrastructure
risk: high
requires_permission: true
required_tools:
  - shell_execute
  - read_file
optional_tools:
  - check_connectivity
---

# Deployment Pre-Flight & Orchestration

## Purpose
Execute pre-flight checks, build production bundles, and deploy to target cloud platforms.

## When to Activate
Activate when deploying web apps, servers, or releasing CLI distribution binaries.

## Required Tools
- `shell_execute`
- `read_file`

## Optional Tools
- `check_connectivity`

## Inputs
Deployment target (Vercel, Cloudflare Workers, Docker, AWS, GCP), environment.

## Preconditions
Production build must be generated and passing all tests.

## Procedure
1. PRE-FLIGHT: Confirm tests pass, typecheck passes, and working tree is clean.
2. Verify production build artifacts exist and have been validated.
3. Check target platform credentials and connectivity.
4. Execute deployment tool or CLI (e.g. vercel deploy, wrangler deploy, gcloud run deploy).
5. Verify deployment URL returns HTTP 200 with expected response headers.
6. Return deployment report with live URL.

## Tool Usage
Call shell_execute with deployment CLI tool.

## Safety
Require explicit user authorization before triggering production deployments.

## Permissions
High risk deployment capability.

## Verification
Check that deployed live URL is reachable and serves the new build.

## Failure Handling
If deployment fails, capture platform error log and preserve previous active revision.

## Output Contract
DeploymentResult with target, environment, liveUrl, deployedRevision.

## Examples
Deploying documentation site to Vercel with pre-flight test validation.

## Related Skills
- `infrastructure-ci-cd`
- `build-build`
