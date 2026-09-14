---
name: network-http
version: 1.0.0
description: Sends structured HTTP GET, POST, PUT, DELETE requests with headers and payload validation.
category: network
risk: medium
requires_permission: true
required_tools:
  - http_request
optional_tools:
  - check_connectivity
---

# Structured HTTP Client Operations

## Purpose
Execute REST and HTTP requests with status code validation and header management.

## When to Activate
Activate when testing local server endpoints, interacting with REST APIs, or health checks.

## Required Tools
- `http_request`

## Optional Tools
- `check_connectivity`

## Inputs
URL, HTTP method, headers, request body, timeout.

## Preconditions
Target host must be valid; local endpoints require running service.

## Procedure
1. Check network permission policy and sanitize URL.
2. Formulate HTTP request payload and headers (User-Agent, Content-Type, Authorization).
3. Send request via http_request tool.
4. Capture response status code, headers, and body.
5. Parse JSON responses automatically if header indicates application/json.
6. Return structured HTTP response.

## Tool Usage
Invoke http_request with method, url, headers, and body.

## Safety
SSRF Protection: Block private network addresses (e.g. AWS metadata 169.254.169.254) unless explicitly authorized for localhost.

## Permissions
Requires network capability.

## Verification
Check that response status is within expected range (e.g. 200-299).

## Failure Handling
If connection refused, check if local server is running on target port.

## Output Contract
HttpResponse with status, headers, body, durationMs.

## Examples
Sending GET request to http://127.0.0.1:11434/api/tags to query Ollama models.

## Related Skills
- `network-api`
- `network-connectivity`
