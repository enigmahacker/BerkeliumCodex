---
name: infrastructure-docker
version: 1.0.0
description: Builds, inspects, and manages Dockerfiles, multi-stage builds, containers, and images.
category: infrastructure
risk: medium
requires_permission: true
required_tools:
  - read_file
  - shell_execute
optional_tools:
  - write_file
---

# Docker Containerization & Image Management

## Purpose
Author optimized multi-stage Dockerfiles, inspect container health, and run containerized builds.

## When to Activate
Activate when containerizing applications, writing Dockerfiles, or debugging container builds.

## Required Tools
- `read_file`
- `shell_execute`

## Optional Tools
- `write_file`

## Inputs
Dockerfile path, image tag, container port mappings.

## Preconditions
Docker daemon or OrbStack running on host.

## Procedure
1. Inspect Dockerfile for multi-stage build optimization and non-root user security.
2. Verify .dockerignore exists to exclude node_modules, .git, and secrets.
3. Build image using docker build -t <tag> . via shell_execute.
4. Verify image layers and resulting image size.
5. If running container: map ports and pass environment variables safely.
6. Return build status.

## Tool Usage
Use read_file to review Dockerfile; shell_execute for docker CLI.

## Safety
NEVER build or run Docker containers with privileged mode (--privileged) without explicit confirmation.

## Permissions
Requires shell execution and Docker daemon access.

## Verification
Confirm docker build completes successfully with exit code 0.

## Failure Handling
If build fails on missing file, check .dockerignore patterns.

## Output Contract
DockerBuildResult with imageTag, sizeMb, status.

## Examples
Building production Alpine container for Berkelium CLI.

## Related Skills
- `infrastructure-ci-cd`
- `security-security-audit`
