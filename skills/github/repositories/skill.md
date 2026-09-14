---
name: github-repositories
version: 1.0.0
description: Interacts with GitHub repository metadata, clones, remotes, and branch protection rules.
category: github
risk: safe
requires_permission: false
required_tools:
  - shell_execute
optional_tools:
  - http_request
---

# GitHub Repository Management

## Purpose
Query remote repository metadata, fork relationships, default branch, and origin remotes.

## When to Activate
Activate when synchronizing with upstream repositories or configuring remotes.

## Required Tools
- `shell_execute`

## Optional Tools
- `http_request`

## Inputs
Repository slug (owner/repo), remote name.

## Preconditions
gh CLI or GitHub API token must be configured if making authenticated calls.

## Procedure
1. Inspect local git remotes via git remote -v.
2. Query repository metadata using gh repo view or GitHub API.
3. Check default branch name (e.g. main vs master).
4. Verify repository access permissions and visibility (public/private).
5. Return structured repository details.

## Tool Usage
Execute gh repo view or curl against api.github.com.

## Safety
Do not clone or pull into non-empty directories without confirmation.

## Permissions
Safe read-only inspection.

## Verification
Confirm repository details contain valid owner, repo, and defaultBranch fields.

## Failure Handling
If gh is not authenticated, fall back to public unauthenticated GitHub API endpoints.

## Output Contract
RepositoryInfo with owner, name, defaultBranch, isPrivate, url.

## Examples
Inspecting metadata for enigmahacker/BerkeliumCodex.

## Related Skills
- `github-pull-requests`
- `git-status`
