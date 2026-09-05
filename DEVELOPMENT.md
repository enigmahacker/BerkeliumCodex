# Berkelium Development Guide

## Environment Prerequisites
- Node.js >= 20 (Node 22 or 26 recommended)
- `pnpm` >= 9 (`corepack enable` or `npm i -g pnpm`)
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
