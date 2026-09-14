---
name: infrastructure-environment
version: 1.0.0
description: Manages multi-environment configuration (development, staging, production) and .env files.
category: infrastructure
risk: medium
requires_permission: true
required_tools:
  - read_file
optional_tools:
  - write_file
  - file_metadata
---

# Multi-Environment Configuration & .env Management

## Purpose
Manage development, staging, and production environment settings while protecting secret tokens.

## When to Activate
Activate when bootstrapping new dev setups, loading environment configs, or checking .env files.

## Required Tools
- `read_file`

## Optional Tools
- `write_file`
- `file_metadata`

## Inputs
Environment name (dev, staging, prod), variable keys.

## Preconditions
Workspace must be configured.

## Procedure
1. Inspect .env.example or template to determine required configuration variables.
2. Verify that .env is listed in .gitignore so secrets are never committed.
3. Check for missing required environment variables.
4. If generating .env: use write_file with placeholder values, alerting user to fill actual keys.
5. Return environment audit report.

## Tool Usage
Use read_file to check templates; write_file for .env.local.

## Safety
NEVER commit .env, .env.local, or credential vaults to git.

## Permissions
Requires filesystem write permission for creating local env files.

## Verification
Verify .gitignore contains .env before creating any local configuration file.

## Failure Handling
If .env is tracked in git, immediately untrack with git rm --cached .env.

## Output Contract
EnvironmentConfigStatus with environmentName, variablesPresent: string[], missing: string[].

## Examples
Checking if all variables in .env.example are defined in local environment.

## Related Skills
- `security-secrets`
- `terminal-environment`
