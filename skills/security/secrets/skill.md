---
name: security-secrets
version: 1.0.0
description: Detects and redacts secrets (API keys, tokens, passwords, private keys) from logs and outputs.
category: security
risk: safe
requires_permission: false
required_tools:
  []
optional_tools:
  - read_file
---

# Secret Detection & Automatic Redaction

## Purpose
Prevent sensitive tokens, private keys, passwords, and credentials from leaking into model prompts or UI logs.

## When to Activate
Activate automatically on every model prompt layer, tool output, and log record.

## Required Tools
None.

## Optional Tools
- `read_file`

## Inputs
Raw text buffer or stream.

## Preconditions
SecretDetector and SecretRedactor must be active in tool pipeline.

## Procedure
1. Scan text buffer against high-entropy regex patterns (OpenAI sk-, GitHub ghp_, JWTs, AWS keys).
2. Identify private key blocks (-----BEGIN PRIVATE KEY-----).
3. If secret is detected, replace with redacted placeholder (e.g. [REDACTED_API_KEY_...]).
4. Emit secret_detected event if an active secret was found in source files.
5. Return sanitized text string.

## Tool Usage
Operates via SecretRedactor in @berkelium/permissions.

## Safety
NEVER disable secret redaction in production or logging pipelines.

## Permissions
Safe in-memory redaction.

## Verification
Check that sanitized output contains zero raw credential substrings.

## Failure Handling
If pattern is uncertain, err on the side of caution and redact.

## Output Contract
RedactedOutput with sanitizedText: string, secretsRedactedCount: number.

## Examples
Redacting an accidentally logged Groq API key in tool stdout.

## Related Skills
- `security-security-audit`
- `terminal-environment`
