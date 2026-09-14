---
name: data-xml
version: 1.0.0
description: Parses and queries XML documents, JUnit test reports, and SVG graphics.
category: data
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - write_file
---

# XML Document & JUnit Report Processing

## Purpose
Parse XML configuration files (pom.xml, AndroidManifest.xml) and test result summaries (junit.xml).

## When to Activate
Activate when parsing JUnit test runner outputs or Maven/Android build files.

## Required Tools
- `read_file`

## Optional Tools
- `write_file`

## Inputs
XML file path, XPath or tag name to query.

## Preconditions
XML file must be readable.

## Procedure
1. Read XML file using read_file.
2. Parse XML DOM tree structure.
3. Query targeted nodes (e.g. <testsuite>, <dependency>).
4. Extract element attributes and text content.
5. Return structured node object.

## Tool Usage
Call read_file.

## Safety
XXE Protection: Disable external entity resolution to prevent XML External Entity attacks.

## Permissions
Safe read-only operation.

## Verification
Confirm XML is well-formed with closing tags.

## Failure Handling
If XML is malformed, report unclosed tag or line syntax error.

## Output Contract
XmlParseResult with rootElement, attributes, children: array.

## Examples
Extracting test failure details from junit.xml report.

## Related Skills
- `testing-test-execution`
- `data-json`
