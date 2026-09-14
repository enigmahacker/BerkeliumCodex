---
name: web-browser
version: 1.0.0
description: Coordinates browser subagent actions for complex interactive web sessions.
category: web
risk: low
requires_permission: true
required_tools:
  - browser_navigate
optional_tools:
  - browser_inspect
  - browser_screenshot
---

# Browser Automation Supervision

## Purpose
Supervise headless browser instances for JavaScript-heavy web pages and web app verification.

## When to Activate
Activate when static web_open fails due to client-side rendering or interactive logins.

## Required Tools
- `browser_navigate`

## Optional Tools
- `browser_inspect`
- `browser_screenshot`

## Inputs
Target URL, session goal, timeout.

## Preconditions
Browser driver or Chrome DevTools MCP must be accessible.

## Procedure
1. Launch headless browser session.
2. Navigate to target URL using browser_navigate.
3. Wait for network idle or main content selector to render.
4. Extract rendered DOM or capture screenshot.
5. Close browser session cleanly to prevent resource leaks.

## Tool Usage
Call browser_navigate and browser_inspect.

## Safety
Do not allow arbitrary script execution or automated submission of financial/sensitive forms.

## Permissions
Requires browser execution permission.

## Verification
Confirm browser navigated to expected URL and DOM is populated.

## Failure Handling
If browser crashes or hangs, kill browser process and fall back to web_open.

## Output Contract
BrowserSessionReport with finalUrl, domText, screenshotPath.

## Examples
Inspecting a React SPA documentation site that requires client-side rendering.

## Related Skills
- `browser-navigation`
- `browser-page-inspection`
