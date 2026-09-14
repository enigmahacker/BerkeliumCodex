---
name: security-threat-modeling
version: 1.0.0
description: Analyzes application attack surfaces, trust boundaries, injection vectors, and auth flows.
category: security
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - search_files
---

# Application Threat Modeling & Attack Surface Analysis

## Purpose
Identify trust boundaries, untrusted input ingress points, prompt injection vectors, and data exfiltration risks.

## When to Activate
Activate when designing new network APIs, auth mechanisms, or web research pipelines.

## Required Tools
- `read_file`

## Optional Tools
- `search_files`

## Inputs
Architecture documentation, API route definitions, input handling code.

## Preconditions
System architecture must be understood.

## Procedure
1. Map data ingress points (user prompts, web search content, HTTP webhooks, files).
2. Identify trust boundaries separating untrusted input from execution runtime.
3. Evaluate prompt injection vectors in tools that consume web content.
4. Assess command injection risks in shell execution helpers.
5. Recommend defensive mitigations (input sanitization, schema validation, sandboxing).

## Tool Usage
Use search_files and read_file to inspect input validation code.

## Safety
Read-only analysis.

## Permissions
Safe operation.

## Verification
Confirm all ingress points have explicit validation or sanitization mechanisms.

## Failure Handling
Document unresolved threat vectors in security advisory report.

## Output Contract
ThreatModelReport with attackSurfaces: array, threats: array, mitigations: array.

## Examples
Threat modeling the web search pipeline to prevent indirect prompt injection.

## Related Skills
- `security-security-audit`
- `web-source-verification`
