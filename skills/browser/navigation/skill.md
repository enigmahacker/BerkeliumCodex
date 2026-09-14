---
name: browser-navigation
version: 1.0.0
description: Navigates headless browser to web addresses, manages redirects, cookies, and history.
category: browser
risk: low
requires_permission: true
required_tools:
  - browser_navigate
optional_tools:
  - browser_inspect
---

# Headless Browser Navigation

## Purpose
Drive headless Chrome/Chromium sessions, navigate to URLs, handle timeouts and redirects.

## When to Activate
Activate when interacting with client-rendered applications or multi-step web workflows.

## Required Tools
- `browser_navigate`

## Optional Tools
- `browser_inspect`

## Inputs
Target URL, timeout_ms (default 30000), waitUntil (load, domcontentloaded, networkidle).

## Preconditions
Browser automation server (Playwright or Chrome DevTools MCP) must be running.

## Procedure
1. Sanitize target URL and check network permissions.
2. Initialize or reuse active browser page.
3. Call browser_navigate with URL and waitUntil strategy.
4. Verify HTTP status is 200/300 range.
5. Capture loaded page title and final URL.

## Tool Usage
Invoke browser_navigate with url.

## Safety
Block navigation to file:///, 169.254.169.254, or internal loopback ports without permission.

## Permissions
Requires browser navigation permission.

## Verification
Confirm browser page loads and returns HTTP 200.

## Failure Handling
If page times out, retry with domcontentloaded or fall back to web_open.

## Output Contract
NavigationResult with finalUrl, httpStatus, title, durationMs.

## Examples
Navigating browser to local dev server http://localhost:3000 to test web app.

## Related Skills
- `browser-page-inspection`
- `browser-interaction`
- `web-browser`
