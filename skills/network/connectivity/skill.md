---
name: network-connectivity
version: 1.0.0
description: Validates internet connectivity, DNS resolution, and latency to key AI and package registries.
category: network
risk: safe
requires_permission: false
required_tools:
  - check_connectivity
optional_tools:
  - shell_execute
---

# Network Reachability & Connectivity Diagnostics

## Purpose
Determine if system is online, identify proxy issues, and test reachability to AI providers.

## When to Activate
Activate on startup, during bk doctor, or when network calls timeout.

## Required Tools
- `check_connectivity`

## Optional Tools
- `shell_execute`

## Inputs
Target host or service (github.com, openrouter.ai, registry.npmjs.org).

## Preconditions
None.

## Procedure
1. Call check_connectivity tool.
2. Probe DNS resolution for key services (GitHub, NPM, Provider endpoints).
3. Measure round-trip ping/HTTP latency in milliseconds.
4. Report network state: online, offline, degraded, captive portal.
5. Return connectivity diagnostic report.

## Tool Usage
Invoke check_connectivity.

## Safety
Safe read-only network probe.

## Permissions
Safe operation.

## Verification
Confirm connectivity test reports valid latency and status.

## Failure Handling
If offline, instruct agent to switch to local providers (Ollama, MLX, GGUF).

## Output Contract
ConnectivityStatus with isOnline: boolean, latencyMs: number, reachableEndpoints: array.

## Examples
Testing latency to OpenRouter API and GitHub.

## Related Skills
- `terminal-diagnostics`
- `network-http`
