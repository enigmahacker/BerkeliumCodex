---
name: languages-go
version: 1.0.0
description: Go module conventions, goroutines, channel synchronization, go vet, and go test.
category: languages
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - shell_execute
---

# Go Language & Module Engineering

## Purpose
Standardize Go development: explicit error handling (if err != nil), goroutine safety, and testing.

## When to Activate
Activate when working in Go projects (*.go, go.mod).

## Required Tools
- `read_file`

## Optional Tools
- `shell_execute`

## Inputs
Go source files, go.mod.

## Preconditions
Go compiler toolchain must be installed.

## Procedure
1. Inspect go.mod for module path and Go version.
2. Verify explicit error checks on all function calls returning error.
3. Validate concurrency safety: ensure Mutex locks are paired with defer unlock.
4. Run go vet ./... to catch common programming defects.
5. Run go test -v -race ./... to test with race detector enabled.

## Tool Usage
Use read_file to inspect code; shell_execute for go test.

## Safety
Always run tests with -race to detect data races.

## Permissions
Safe convention guidelines.

## Verification
Confirm go test passes with zero race condition detections.

## Failure Handling
If race condition detected, inspect shared variable access and add mutex guards.

## Output Contract
GoToolchainStatus with goVersion, vetClean: boolean, raceClean: boolean.

## Examples
Running go test -v -race ./... in a Go backend service.

## Related Skills
- `testing-test-execution`
- `build-build`
