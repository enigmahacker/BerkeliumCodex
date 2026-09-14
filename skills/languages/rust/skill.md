---
name: languages-rust
version: 1.0.0
description: Rust cargo workflows, borrow checker rules, zero-cost abstractions, clippy, and cargo test.
category: languages
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - shell_execute
---

# Rust Systems Programming & Cargo Toolchain

## Purpose
Guide Rust development: ownership semantics, error handling (Result/Option), clippy, and cargo tests.

## When to Activate
Activate when inspecting or building Rust code (*.rs, Cargo.toml).

## Required Tools
- `read_file`

## Optional Tools
- `shell_execute`

## Inputs
Rust source files, Cargo.toml.

## Preconditions
Rust toolchain (cargo, rustc) must be installed.

## Procedure
1. Inspect Cargo.toml for dependencies, features, and edition (e.g. 2021).
2. Verify idiomatic error handling: use ? operator and custom error enums instead of unwrap().
3. Run cargo check for rapid syntax and borrow checker validation.
4. Run cargo clippy --all-targets for linting.
5. Run cargo test to execute unit and integration test suites.

## Tool Usage
Call shell_execute with cargo commands.

## Safety
Avoid unsafe blocks unless strictly required for FFI, with documented safety invariants.

## Permissions
Safe convention guidelines.

## Verification
Confirm cargo check and cargo test exit with code 0.

## Failure Handling
If borrow checker error E0502 occurs, restructure lifetimes or clone values.

## Output Contract
RustToolchainReport with rustcVersion, clippyClean: boolean, testPass: boolean.

## Examples
Running cargo test --package berkelium-core in a Rust workspace.

## Related Skills
- `build-build`
- `testing-test-execution`
