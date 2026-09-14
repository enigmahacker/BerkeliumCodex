---
name: browser-page-inspection
version: 1.0.0
description: Inspects rendered DOM elements, accessibility trees, computed styles, and text content.
category: browser
risk: safe
requires_permission: false
required_tools:
  - browser_inspect
optional_tools:
  - browser_screenshot
---

# DOM & Accessibility Tree Inspection

## Purpose
Examine rendered DOM nodes, ARIA roles, input form fields, and text content.

## When to Activate
Activate after browser navigation before clicking or typing on interactive elements.

## Required Tools
- `browser_inspect`

## Optional Tools
- `browser_screenshot`

## Inputs
CSS selector (optional), accessibility snapshot flag.

## Preconditions
Browser page must be loaded.

## Procedure
1. Call browser_inspect to retrieve the accessibility tree or DOM snippet.
2. Identify unique selectors or ARIA labels for interactive elements.
3. Verify that expected UI components (buttons, forms, headings) are rendered.
4. Extract text content or input values.
5. Return structured DOM representation.

## Tool Usage
Invoke browser_inspect.

## Safety
Read-only inspection.

## Permissions
Safe read-only operation.

## Verification
Confirm inspection returns non-empty element tree.

## Failure Handling
If selector is not found, wait 1000ms for dynamic rendering or inspect parent element.

## Output Contract
PageInspectionResult with elements: array, textContent: string.

## Examples
Inspecting login form inputs and submit button on local web app.

## Related Skills
- `browser-navigation`
- `browser-interaction`
