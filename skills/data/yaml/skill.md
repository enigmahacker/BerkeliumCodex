---
name: data-yaml
version: 1.0.0
description: Parses, generates, and formats YAML configurations for GitHub Actions, Docker Compose, and skills.
category: data
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - write_file
  - edit_file
---

# YAML Configuration Parsing & Generation

## Purpose
Work with YAML files including skill frontmatter, CI/CD workflows, and Kubernetes manifests.

## When to Activate
Activate when editing .github/workflows/*.yml, skill frontmatter, or docker-compose.yml.

## Required Tools
- `read_file`

## Optional Tools
- `write_file`
- `edit_file`

## Inputs
YAML file path or content string.

## Preconditions
Target file must be accessible.

## Procedure
1. Read YAML content using read_file.
2. Parse indentation hierarchy (2-space standard).
3. Validate YAML syntax and type mappings.
4. Extract targeted configuration blocks.
5. Return parsed object or serialized YAML string.

## Tool Usage
Use read_file to inspect, edit_file to modify specific lines.

## Safety
Ensure indentation is strictly preserved to prevent semantic changes.

## Permissions
Safe read-only unless modifying files.

## Verification
Check that YAML parses back into expected data structures without syntax errors.

## Failure Handling
If indentation is malformed, report line number and expected indent level.

## Output Contract
YamlProcessingResult with data: object, yamlText: string.

## Examples
Parsing frontmatter metadata in SKILL.md files.

## Related Skills
- `data-json`
- `infrastructure-github-actions`
