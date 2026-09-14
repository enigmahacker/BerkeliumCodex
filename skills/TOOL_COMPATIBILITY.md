# Berkelium Codex — Tool Compatibility & Runtime Integration

This document defines the tool interface expectations for Berkelium Codex agents. Every skill relies on standard tool contracts or provides explicit fallback procedures.

---

## 1. Supported Toolset

| Tool Name | Subsystem | Purpose | Safety Boundaries |
| :--- | :--- | :--- | :--- |
| `list_directory` | Filesystem | Lists directory entries with file types and sizes. | Safe. Skips hidden/vcs directories by default. |
| `read_file` | Filesystem | Reads text or binary file contents with offset/limit. | Safe. Detects binary files and prevents OOM. |
| `write_file` | Filesystem | Creates or replaces files atomically. | Medium risk. Requires explicit confirmation for existing files. |
| `edit_file` | Filesystem | Targeted search-and-replace chunk editing. | Low/Medium risk. Enforces unique match and format check. |
| `delete_file` | Filesystem | Removes files or directories permanently. | **DESTRUCTIVE**. Mandatory confirmation required. |
| `move_file` | Filesystem | Renames or moves files atomically. | Medium risk. Verifies destination existence. |
| `copy_file` | Filesystem | Copies files preserving permissions. | Low risk. |
| `search_files` | Filesystem | Fast ripgrep text/regex search across workspace. | Safe. Respects .gitignore. |
| `file_metadata` | Filesystem | Retrieves stat info, permissions, and MIME types. | Safe. |
| `shell_execute` | Terminal | Runs shell commands with cwd, timeout, and buffer caps. | Variable risk. Subject to permission policy. |
| `process_list` | Terminal | Lists running background processes and subagents. | Safe. |
| `process_kill` | Terminal | Sends SIGTERM/SIGKILL to running tasks. | **DESTRUCTIVE**. Requires confirmation for user processes. |
| `environment_get` | Terminal | Inspects non-sensitive environment variables. | Safe. Automatically redacts secret tokens. |
| `diagnostics_run` | Terminal | Executes lsp/compiler diagnostic analyzers. | Safe. |
| `git_status` | Git | Returns branch state, staged, unstaged, untracked files. | Safe. |
| `git_diff` | Git | Generates unified diffs between commits or index. | Safe. |
| `git_log` | Git | Inspects commit history and author metadata. | Safe. |
| `git_branch` | Git | Lists, creates, or deletes local/remote branches. | Low risk (create/list); High risk (delete). |
| `git_commit` | Git | Commits staged changes with conventional message. | Medium risk. |
| `git_merge` | Git | Merges branches or aborts conflicts. | High risk. Verifies clean working copy. |
| `git_restore` | Git | Restores modified files or discards unstaged edits. | **DESTRUCTIVE**. Requires confirmation. |
| `web_search` | Web | Queries search engines for technical documentation. | Safe. Treats snippets as preliminary leads. |
| `web_open` | Web | Loads full webpage contents via headless HTTP/DOM. | Safe. Input quarantined as untrusted data. |
| `web_fetch` | Web | Retrieves static markdown or API response from URL. | Safe. |
| `web_cite` | Web | Generates verified bibliographic citations with URLs. | Safe. |
| `browser_navigate` | Browser | Navigates headless Chromium instance to URL. | Safe. |
| `browser_inspect` | Browser | Inspects DOM tree, ARIA attributes, and styles. | Safe. |
| `browser_click` | Browser | Emulates user clicks on specific CSS selectors. | Low risk. |
| `browser_type` | Browser | Types input strings into targeted form fields. | Low risk. |
| `browser_screenshot` | Browser | Captures full page or element viewport screenshot. | Safe. |
| `browser_evaluate` | Browser | Evaluates sandboxed JavaScript in browser context. | Medium risk. |
| `http_request` | Network | Executes custom HTTP GET, POST, PUT, DELETE calls. | Variable risk. |
| `download_file` | Network | Streams remote asset to local disk with checksum check. | Medium risk. |
| `check_connectivity` | Network | Probes DNS resolution and TCP reachability. | Safe. |
| `agent_spawn` | Agent | Initializes specialized subagent with isolated context. | Medium risk. Bounded by timeout and tool budget. |
| `agent_delegate` | Agent | Hands off bounded subtask to child agent. | Medium risk. |
| `agent_parallel` | Agent | Runs multiple independent subagents concurrently. | Medium risk. |
| `agent_await` | Agent | Awaits completion and aggregates child agent results. | Safe. |

---

## 2. Fallback Hierarchy

When a native tool is not provided by the runtime environment, agents must degrade gracefully:

1. **Native Tool Failure ──▶ Shell Equivalent** (e.g. if `search_files` is absent, fall back to `shell_execute` with `rg` or `grep`).
2. **Shell Failure ──▶ Stored Context Analysis** (e.g. if terminal is disabled, parse existing manifest files using `read_file`).
3. **Network Absence ──▶ Offline Mode** (e.g. if `web_search` is disabled, query local documentation and repository specs).
