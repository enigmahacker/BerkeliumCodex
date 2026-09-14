---
name: languages-python
version: 1.0.0
description: Python project conventions, virtual environments (venv, uv, poetry), pytest, and type hints.
category: languages
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - shell_execute
---

# Python Engineering Conventions

## Purpose
Standardize Python development: virtual environments, package managers, linting (Ruff), and pytest.

## When to Activate
Activate when working in Python repositories (*.py, pyproject.toml, requirements.txt).

## Required Tools
- `read_file`

## Optional Tools
- `shell_execute`

## Inputs
Python source files, dependency manifests.

## Preconditions
Python interpreter or virtual environment must exist.

## Procedure
1. Detect package and virtual environment manager (uv, poetry, venv, conda).
2. Activate virtual environment or prefix commands with uv run / poetry run.
3. Verify type hints using mypy or pyright.
4. Run tests using pytest with coverage flags.
5. Format code adhering to PEP 8 using Ruff or Black.

## Tool Usage
Use read_file to inspect Python code; shell_execute for pytest / ruff.

## Safety
Never run pip install globally; always enforce virtual environment isolation.

## Permissions
Safe convention guidelines.

## Verification
Confirm pytest runs with exit code 0 and mypy reports zero type errors.

## Failure Handling
If ModuleNotFoundError occurs, install missing dependency into active venv.

## Output Contract
PythonEnvironmentSummary with pythonVersion, venvType, testRunner.

## Examples
Running pytest tests/ -v in an isolated uv virtual environment.

## Related Skills
- `testing-test-execution`
- `build-type-check`
