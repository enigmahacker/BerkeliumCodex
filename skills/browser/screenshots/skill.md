---
name: browser-screenshots
version: 1.0.0
description: Captures full-page or element-level screenshots for visual regression and verification.
category: browser
risk: low
requires_permission: true
required_tools:
  - browser_screenshot
optional_tools:
  - file_metadata
---

# Visual Screenshot Capture & Verification

## Purpose
Capture visual artifacts of rendered web applications for regression review and user verification.

## When to Activate
Activate when validating frontend UI changes, layout responsiveness, or bug visual evidence.

## Required Tools
- `browser_screenshot`

## Optional Tools
- `file_metadata`

## Inputs
Output image path, fullPage flag (boolean), element selector (optional).

## Preconditions
Browser page must be fully rendered.

## Procedure
1. Verify target directory for screenshot exists in workspace or artifacts.
2. Invoke browser_screenshot with destination path and fullPage options.
3. Verify that image was saved to disk and has valid PNG/JPEG dimensions.
4. Embed screenshot path into walkthrough or verification report.
5. Return screenshot artifact path.

## Tool Usage
Invoke browser_screenshot with path.

## Safety
Ensure screenshot does not capture sensitive user data or credentials displayed on screen.

## Permissions
Requires filesystem write permission.

## Verification
Verify image file exists on disk with non-zero size.

## Failure Handling
If capture fails, check page dimensions and viewport configuration.

## Output Contract
ScreenshotResult with filePath, width, height, sizeBytes.

## Examples
Capturing full-page screenshot of rendered dashboard for walkthrough report.

## Related Skills
- `browser-page-inspection`
- `core-verification`
