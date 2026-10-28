# Berkelium Development Guide

## Environment Prerequisites
- Node.js >= 22.13.0 (Node 22, 24, or 26 supported)
- `pnpm` >= 11.7.0 (`corepack enable` or `npm i -g pnpm`)
- `git` >= 2.40

## Getting Started
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run in development mode
pnpm berkelium

# Run tests
pnpm test

# Run benchmarks
pnpm bench
```

## Structure
- `apps/cli`: The terminal CLI application.
- `packages/`: Modular sub-packages representing the runtime, providers, tools, context, permissions, auth, themes, config, plugins, and telemetry.
- `benchmarks/`: Systematic performance benchmark suites.
