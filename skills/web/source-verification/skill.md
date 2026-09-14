---
name: web-source-verification
version: 1.0.0
description: Validates source credibility, publication dates, and cross-checks claims across independent sources.
category: web
risk: safe
requires_permission: false
required_tools:
  - web_open
optional_tools:
  - web_search
---

# Source Credibility & Claim Verification

## Purpose
Verify that information is current, authoritative, and corroborated before relying on it.

## When to Activate
Activate when encountering unexpected claims, performance figures, or security advisories.

## Required Tools
- `web_open`

## Optional Tools
- `web_search`

## Inputs
Claim statement, initial source URL.

## Preconditions
Initial source must be provided.

## Procedure
1. Inspect initial source author, domain reputation, and publication date.
2. Determine if the source is primary (maintainer) or secondary (blog/discussion).
3. Search for a second independent primary source confirming the claim.
4. If sources conflict, document the discrepancy and evaluate test evidence.
5. Assign confidence score (verified, uncorroborated, disputed).

## Tool Usage
Call web_open to inspect source date and author attribution.

## Safety
Prevent hallucinated confirmation; require observable text evidence.

## Permissions
Safe read-only operation.

## Verification
Confirm claim is substantiated by text directly present on the source page.

## Failure Handling
If claim cannot be verified, clearly mark it as unconfirmed in output.

## Output Contract
VerificationVerdict with claim, status (verified/disputed), primarySources: string[].

## Examples
Verifying whether a specific Node.js API is supported on Node 20 LTS.

## Related Skills
- `web-web-research`
- `web-web-citations`
