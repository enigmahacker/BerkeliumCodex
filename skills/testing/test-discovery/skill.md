---
name: testing-test-discovery
version: 1.0.0
description: Discovers test runners, frameworks, config files, and test files across the repository.
category: testing
risk: safe
requires_permission: false
required_tools:
  - search_files
optional_tools:
  - read_file
  - list_directory
---

# Test Suite Discovery & Inventory

## Purpose
Identify the project testing framework (Vitest, Jest, Pytest, Cargo test, Go test) and map all test suites.

## When to Activate
Activate at project onboarding, before running tests, or when planning test coverage.

## Required Tools
- `search_files`

## Optional Tools
- `read_file`
- `list_directory`

## Inputs
Workspace root path.

## Preconditions
Workspace must be accessible.

## Procedure
1. Inspect package.json or project config for test runner dependencies (vitest, jest, mocha, pytest).
2. Locate test configuration files (vitest.config.ts, jest.config.js, pytest.ini).
3. Search for test files using search_files (**/*.test.ts, **/*_test.go, test_*.py).
4. Categorize tests into unit, integration, security, and golden workflows.
5. Return structured test catalog.

## Tool Usage
Use search_files with test file glob patterns.

## Safety
Read-only discovery.

## Permissions
Safe operation.

## Verification
Confirm test count is non-zero and test framework is detected.

## Failure Handling
If no test runner is configured, suggest setting up Vitest or standard runner.

## Output Contract
TestDiscoveryCatalog with framework, configPath, totalSuites, testFiles: string[].

## Examples
Discovering 50 test files in BerkeliumCodex matching tests/**/*.test.ts.

## Related Skills
- `testing-test-execution`
- `project-project-discovery`
