---
name: browser-interaction
version: 1.0.0
description: Clicks buttons, types into input fields, selects dropdowns, and submits forms.
category: browser
risk: medium
requires_permission: true
required_tools:
  - browser_click
  - browser_type
optional_tools:
  - browser_inspect
---

# Browser Element Interaction

## Purpose
Interact with rendered page controls (click, type, keypress, select) during E2E testing.

## When to Activate
Activate when testing interactive user workflows or submitting web forms.

## Required Tools
- `browser_click`
- `browser_type`

## Optional Tools
- `browser_inspect`

## Inputs
Selector, interaction type (click, type), text to type (for type action).

## Preconditions
Target element must be visible and enabled in the DOM.

## Procedure
1. Inspect target element using browser_inspect to confirm it is interactive.
2. If typing: invoke browser_type with selector and sanitized text.
3. If clicking: invoke browser_click with selector.
4. Wait for resulting network request or DOM mutation.
5. Verify resulting page state.

## Tool Usage
Call browser_click and browser_type.

## Safety
NEVER submit financial transactions, password change forms, or unauthorized destructive actions.

## Permissions
Requires browser interaction capability.

## Verification
Confirm DOM updates or URL changes in response to the interaction.

## Failure Handling
If element is obscured or disabled, inspect overlay modals or wait for enablement.

## Output Contract
InteractionResult with action, selector, success: boolean, resultingUrl.

## Examples
Typing "search query" into search input and clicking submit button.

## Related Skills
- `browser-page-inspection`
- `browser-screenshots`
