---
name: web-web-citations
version: 1.0.0
description: Formats and preserves exact URL citations, anchors, and retrieval timestamps for research claims.
category: web
risk: safe
requires_permission: false
required_tools:
  - web_cite
optional_tools:
  []
---

# Authoritative Citation Formatting

## Purpose
Attach precise, transparent citations to every technical fact derived from external sources.

## When to Activate
Activate whenever synthesizing answers based on web research.

## Required Tools
- `web_cite`

## Optional Tools
None.

## Inputs
List of cited sources (URL, title, author, dateAccessed).

## Preconditions
Sources must have been fetched during current session.

## Procedure
1. Collect all URLs referenced during research turns.
2. Validate that each cited URL was actually inspected during the session.
3. Map claims in the answer text to specific footnote references [1], [2].
4. Append structured Citations section at the end of the response.
5. Ensure links are formatted in standard GitHub markdown.

## Tool Usage
Invoke web_cite with url and title metadata.

## Safety
Never fabricate citations or link to uninspected hallucinated domains.

## Permissions
Safe formatting operation.

## Verification
Verify every citation link is valid and points to the relevant source.

## Failure Handling
If URL is lost, search session history to recover exact link.

## Output Contract
CitationBlock with formatted markdown links and reference index.

## Examples
Attaching official Node.js documentation links to an architectural explanation.

## Related Skills
- `web-web-research`
- `web-source-verification`
