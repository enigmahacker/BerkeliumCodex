---
name: network-api
version: 1.0.0
description: Interacts with REST and GraphQL APIs, handling pagination, rate limits, and JSON schemas.
category: network
risk: medium
requires_permission: true
required_tools:
  - http_request
optional_tools:
  []
---

# API Integration & Query Management

## Purpose
Consume web APIs, handle token auth, rate limits (HTTP 429), and schema validation.

## When to Activate
Activate when integrating third-party APIs or testing backend endpoints.

## Required Tools
- `http_request`

## Optional Tools
None.

## Inputs
API base URL, endpoint path, query parameters, auth token, payload.

## Preconditions
API credentials must be resolved from AuthStore or environment.

## Procedure
1. Resolve API authentication securely without exposing raw secrets.
2. Construct URL with serialized query parameters.
3. Call http_request with appropriate auth headers.
4. If HTTP 429 (Rate Limited) is received, extract Retry-After header and back off exponentially.
5. Validate response structure against expected schema.
6. Return parsed data payload.

## Tool Usage
Invoke http_request with bearer token header.

## Safety
Never log authorization headers or write bearer tokens to disk.

## Permissions
Requires network capability.

## Verification
Confirm API response contains expected data fields.

## Failure Handling
Handle auth failures (401/403) by prompting user to re-authenticate with auth store.

## Output Contract
ApiResponse with data: object, status: number, rateLimitRemaining: number.

## Examples
Querying OpenRouter API /models endpoint.

## Related Skills
- `network-http`
- `security-secrets`
