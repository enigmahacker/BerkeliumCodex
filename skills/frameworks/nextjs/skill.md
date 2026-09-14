---
name: frameworks-nextjs
version: 1.0.0
description: Next.js App Router, Server Components (RSC), Client Components, SSR, and API routes.
category: frameworks
risk: safe
requires_permission: false
required_tools:
  - read_file
optional_tools:
  - shell_execute
---

# Next.js App Router & Server Components

## Purpose
Standardize Next.js architecture: React Server Components, Client boundaries ("use client"), and SSG.

## When to Activate
Activate when working in Next.js codebases (app/, pages/, next.config.js/ts).

## Required Tools
- `read_file`

## Optional Tools
- `shell_execute`

## Inputs
Next.js route files, layouts, page components.

## Preconditions
Next.js project structure must be present.

## Procedure
1. Determine routing paradigm (App Router app/ vs Pages Router pages/).
2. Enforce Server Component default: keep components on the server unless interactivity is required.
3. Explicitly mark interactive client components with "use client" directive at the top.
4. Validate server-side data fetching with fetch() caching options.
5. Run next build to verify static page generation and route compilation.

## Tool Usage
Use read_file to inspect routes; shell_execute for next build.

## Safety
Never import server-only secrets or database clients into client components.

## Permissions
Safe convention guidelines.

## Verification
Confirm next build finishes with 0 route errors and valid manifest.

## Failure Handling
If "You are attempting to export a component with state" occurs, add "use client" directive.

## Output Contract
NextJsReport with routerType (app/pages), ssrStatus: boolean, buildPass: boolean.

## Examples
Validating server-side data fetching and metadata generation in Next.js App Router.

## Related Skills
- `frameworks-react`
- `frameworks-nodejs`
