---
name: network-curl
version: 1.0.0
description: Executes robust curl commands with custom flags, timeouts, proxying, and response header extraction.
category: network
risk: medium
requires_permission: true
required_tools:
  - shell_execute
optional_tools:
  - check_connectivity
---

# cURL Network Operations

## Purpose
Execute CLI-based network queries, download headers, and test server responses via curl.

## When to Activate
Activate when debugging raw HTTP handshakes, SSL certificates, or custom curl scripts.

## Required Tools
- `shell_execute`

## Optional Tools
- `check_connectivity`

## Inputs
cURL command string or target URL with curl flags.

## Preconditions
curl binary must exist on host.

## Procedure
1. Construct safe curl command with --silent --show-error --max-time 30.
2. Avoid curl commands that pipe directly to shell (e.g. curl ... | bash).
3. Execute curl via shell_execute.
4. Capture response stdout and inspect headers (-i or -I).
5. Return sanitized response.

## Tool Usage
Call shell_execute with curl command.

## Safety
NEVER execute commands of the form curl <url> | sh or curl <url> | bash.

## Permissions
Requires network and shell execution capability.

## Verification
Confirm curl completes with exit code 0.

## Failure Handling
If curl exits with 28 (timeout) or 7 (failed to connect), report network error.

## Output Contract
CurlResult with exitCode, stdout, stderr, httpStatus.

## Examples
Executing curl -sI http://127.0.0.1:1234 to verify LM Studio health.

## Related Skills
- `network-http`
- `terminal-shell`
