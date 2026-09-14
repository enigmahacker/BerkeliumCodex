---
name: browser-browser-debugging
version: 1.0.0
description: Inspects browser console errors, failed network requests (HTTP 4xx/5xx), and client crashes.
category: browser
risk: safe
requires_permission: false
required_tools:
  - browser_inspect
optional_tools:
  - browser_evaluate
---

# Client-Side Browser Diagnostics & Debugging

## Purpose
Capture JavaScript console errors, uncaught exceptions, and failed network fetch calls.

## When to Activate
Activate when a web page displays a blank screen, crashes, or fails to fetch data.

## Required Tools
- `browser_inspect`

## Optional Tools
- `browser_evaluate`

## Inputs
Browser session context.

## Preconditions
Browser session must be active.

## Procedure
1. Inspect browser console logs (console.error, console.warn).
2. Retrieve network activity log and identify failed requests (status >= 400).
3. Check for CORS errors or blocked script assets.
4. Extract stack traces of uncaught client-side exceptions.
5. Synthesize root cause and pass to code-debugging.

## Tool Usage
Call browser_inspect with log filter.

## Safety
Read-only diagnostic inspection.

## Permissions
Safe operation.

## Verification
Confirm console errors accurately reflect client-side runtime behavior.

## Failure Handling
If console logs are empty, evaluate window.performance metrics or inspect DOM.

## Output Contract
BrowserDebugReport with consoleErrors: array, failedRequests: array, unhandledExceptions: array.

## Examples
Debugging "Uncaught TypeError: Cannot read properties of undefined" in React SPA.

## Related Skills
- `browser-page-inspection`
- `code-debugging`
