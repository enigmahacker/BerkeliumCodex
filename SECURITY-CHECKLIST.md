# Berkelium Codex Security Audit Checklist

Use this checklist before cutting a release, merging high-risk PRs, or publishing new packages.

## 1. Credential & Secret Hygiene
- [ ] Verify `SecretRedactor` masks API keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `NVIDIA_API_KEY`, `HF_TOKEN`).
- [ ] Ensure no raw credentials or passwords are written to session logs or persistent storage (`~/.berkelium/sessions/`).
- [ ] Confirm local vault (`.auth_vault.json`) uses encrypted fallback where system keychain is unavailable.

## 2. Permission & Policy Boundaries
- [ ] Test 3-tier permission engine (`ASK`, `AUTO`, `FULL`) behavior under unprivileged conditions.
- [ ] Verify protected operations (`rm -rf`, `sudo`, `git reset --hard`, `git push --force`) always prompt for explicit user confirmation, even in `FULL` mode.
- [ ] Confirm tool-layer network enforcement (`/network allow` / `/network deny`) correctly blocks outbound network calls when disabled.

## 3. Input Sanitization & Prompt Injection Defense
- [ ] Verify external content (READMEs, Git commits, web pages) is delineated as untrusted data and cannot override system prompts or grant permissions.
- [ ] Confirm `ResponseNormalizer` correctly strips internal reasoning tags (`<thought>`, `<think>`) and prompt leakage patterns.

## 4. Process & Sandboxing Safety
- [ ] Ensure shell command execution runs with strict timeouts and proper process tree termination on `Ctrl+C`.
- [ ] Verify Server-Side Request Forgery (SSRF) protections block requests to local metadata endpoints (`169.254.169.254`).

## 5. Reporting Vulnerabilities
If you discover a security vulnerability, please report it privately according to [SECURITY.md](./SECURITY.md). Do not open public GitHub issues for security reports.
