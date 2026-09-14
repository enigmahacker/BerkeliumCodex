---
name: frameworks-fastapi
version: 1.0.0
description: FastAPI modern Python web APIs, Pydantic data schemas, dependency injection, and async routes.
category: frameworks
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - shell_execute
---

# FastAPI & Pydantic Microservice Engineering

## Purpose
Standardize FastAPI services: type-annotated route parameters, Pydantic V2 models, and async handlers.

## When to Activate
Activate when working on FastAPI applications (*.py importing fastapi).

## Required Tools
- `read_file`

## Optional Tools
- `shell_execute`

## Inputs
FastAPI route handlers, Pydantic schemas.

## Preconditions
FastAPI and uvicorn dependencies installed in active venv.

## Procedure
1. Inspect app instantiation and route decorators (@app.get, @app.post).
2. Ensure request/response schemas inherit from pydantic.BaseModel with field validations.
3. Use dependency injection (Depends) for database sessions and authentication.
4. Ensure I/O bound database calls are declared with async def.
5. Run test suite using pytest with TestClient.

## Tool Usage
Use read_file to inspect schemas; shell_execute for pytest.

## Safety
Validate all user inputs with Pydantic field constraints to prevent injection.

## Permissions
Safe convention guidelines.

## Verification
Confirm TestClient tests pass and OpenAPI schema (/docs) is valid.

## Failure Handling
If RequestValidationError occurs, verify client payload matches Pydantic schema.

## Output Contract
FastApiAuditResult with routesCount, pydanticVersion, openApiValid: boolean.

## Examples
Writing an async FastAPI endpoint returning structured inference metrics.

## Related Skills
- `languages-python`
- `network-api`
