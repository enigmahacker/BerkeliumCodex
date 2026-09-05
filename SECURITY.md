# Security Policy — Berkelium CLI

Berkelium takes the security and safety of developers, systems, and repositories seriously. This document outlines our security architecture, permission model, credential handling standards, and vulnerability disclosure process.

---

## 1. Security Architecture & Boundary Invariants

Berkelium implements a multi-tier defense-in-depth security boundary:

```
[ UNTRUSTED INPUT: Model Output / Repo Files / Web Content / MCP ]
                             │
                             ▼
               [ Schema & Argument Validation ]
                             │
                             ▼
              [ PermissionEngine & Policy Engine ]
                             │
                             ▼
     [ Security Sandboxes: Workspace Guard, SSRF Guard, Env Sanitizer ]
                             │
                             ▼
             [ Sandboxed Native / MCP Execution ]
                             │
                             ▼
               [ SecretRedactor Sanitization ]
                             │
                             ▼
                 [ TUI / Events / Telemetry ]
```

### Key Security Invariants
1. **Model Neutrality & Untrusted LLMs**: The LLM is an untrusted decision-making component. The security policy is enforced deterministically by the runtime, independent of the model's instructions or reasoning.
2. **Workspace Jail**: All filesystem read, write, edit, search, and delete operations are strictly confined within the canonical workspace root. Relative `../` traversals, prefix collisions, and symlinks pointing outside the workspace are blocked automatically.
3. **Sensitive File Protection**: Critical system and credential paths (`~/.ssh`, `~/.aws`, `~/.gnupg`, `~/.kube`, `~/.docker`, `~/Library/Keychains`, `.env*`, `*.pem`, `*.key`, `id_rsa`, `id_ed25519`) are default-denied and require explicit confirmation.
4. **Subprocess Environment Isolation**: Child processes spawned by `run_shell` or `run_process` receive a sanitized environment where all API keys, bearer tokens, AWS secrets, GitHub tokens, and database passwords have been removed.
5. **SSRF & Network Firewall**: Web-fetching tools (`fetch_url`, `web_search`) enforce an HTTP/HTTPS protocol allowlist and block all requests to loopback addresses (`127.0.0.1`, `localhost`, `::1`), private RFC1918 networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and cloud metadata services (`169.254.169.254`, `metadata.google.internal`). All redirect hops are validated before navigation.
6. **Secret Redaction**: A centralized `SecretRedactor` scrubs credentials (NVIDIA, OpenRouter, OpenAI, Anthropic, Google Cloud, GitHub PATs, AWS keys, JWTs, Bearer headers, SSH private keys, `.env` assignments) before any log, telemetry event, or terminal output is emitted.
7. **Bounded Execution**: Autonomous task execution is strictly bounded (`max_iterations = 40`) with instant Ctrl+C cancellation support.

---

## 2. Credential Handling & Storage

- **macOS Keychain**: On macOS Darwin systems, provider API keys (NVIDIA, OpenRouter, OpenAI, Anthropic) are stored directly in the user's macOS Keychain.
- **Encrypted Vault Fallback**: For environments without Keychain access, credentials are encrypted via AES-256-GCM in `~/.berkelium/credentials.vault`.
- **Zero Prompt Leakage**: Raw API keys and credentials are never passed into model prompt layers, model conversation histories, or tool execution outputs.

---

## 3. CLI Security Commands

Developers can inspect their security posture at any time using built-in slash commands:

- `/security`: View active sandbox status, workspace jail, network firewall, and secret redactor posture.
- `/security audit`: Run an instant real-time security self-audit across 8 invariant security controls.
- `/permissions`: View active filesystem, shell, and network permission policies.
- `/auth status`: Inspect credential storage states without revealing raw keys.

---

## 4. Reporting a Security Vulnerability

If you discover a potential security vulnerability in Berkelium CLI:

1. **Do NOT open a public GitHub issue.**
2. Send a detailed report describing the vulnerability, affected versions, reproduction steps, and potential impact to:
   **security@berkelium.dev**
3. We will acknowledge receipt of your report within **48 hours** and provide a tracking ID and estimated timeline for a patch.
4. Once a fix is released, credit will be given in the release notes according to standard responsible disclosure practices.
