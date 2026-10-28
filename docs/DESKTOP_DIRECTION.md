# Desktop Direction and Audience Validation

Status: **evaluated, not approved for implementation**
Date: 2026-10-28

This note records what is verified about the current product, what is assumed, and what evidence would justify building a desktop application. It does not authorize a desktop implementation, a new local server, or a change to the existing CLI architecture.

---

## 1. Verified Facts

### Repository and audience signals

Measured against `enigmahacker/BerkeliumCodex` on 2026-10-28:

- Created 2026-09-05; last push 2026-09-14.
- 1 star, 1 watcher, 0 forks.
- 0 issues opened, 0 open pull requests. The only merged pull request is a Dependabot vitest bump.
- Issues are enabled; Discussions are disabled.
- Repository topics are unset and the description is empty.
- GitHub traffic for the available 14-day window: 3 views from 2 unique visitors, 23 clones from 17 unique cloners. Traffic data is short-window and should not be treated as adoption.

**Conclusion:** there is no observed external audience yet, and no evidence of desktop demand. This is the decisive constraint on the desktop decision.

The unscoped `berkelium` npm name is occupied by a separate package (`0.2.0-beta.6`, MIT, published by BerkeliumLabs). Installation and audience measurements for this repository must not be conflated with that package.

### Architecture readiness

- Core packages do not render UI to stdout or stderr. The only TTY-aware code is the ANSI styling helper in `packages/themes/src/ansi.ts`, which is presentation-only. A small number of failure paths log with `console.error` (config persistence, event-handler failures, plugin hooks, theme listener failures); a desktop host should route or suppress those rather than treating them as an event stream.
- `Logger` is sink-based: destinations are injected, so a desktop host can collect structured logs without terminal output.
- `AgentRuntime` is constructed programmatically and driven through `executeTask`, `compactContext`, `resumeFromSession`, and explicit getters. It does not own terminal rendering.
- UI state is already event-driven. `EventBus` carries typed `AgentEvent`s, and `packages/events/src/chat-protocol.ts` maps them into a validated, UI-oriented chat protocol (18 event types, 12 display states).
- Permission prompts are injected through a confirmation handler rather than hard-coded to the TUI. A desktop shell could supply its own handler.
- The CLI is the only application in `apps/`. There is no HTTP server, WebSocket server, JSON-RPC bridge, Electron/Tauri code, or desktop packaging.
- `packages/runtime` is local model runtime detection and management (MLX/GGUF), not a desktop application runtime.

**Conclusion:** the runtime/event boundary is structurally suitable for another frontend. A desktop shell would not require rewriting the agent loop, providers, tools, permissions, or context engine. The missing piece is a transport and permission round-trip, not core logic.

### Product positioning

The README, architecture, and contributor guides position Berkelium as terminal-first, Apple Silicon-oriented, and local/cloud model neutral. Desktop is not mentioned anywhere in the documentation or codebase.

---

## 2. Assumptions (Not Verified)

- The most likely early audience is developers already comfortable in a terminal, especially Apple Silicon users running local models. No user research or usage data supports this beyond the repository's stated positioning.
- A graphical interface would broaden adoption. There is no evidence for this; it may instead split limited maintenance capacity.
- Electron would violate the `<150ms` startup and `<100MB` idle budgets in `AGENTS.md`. This is a reasonable expectation from bundling Chromium, but it has not been measured for this project.
- A Tauri or native shell would stay within those budgets. This also has not been measured; a Node sidecar still carries Node's baseline memory.

---

## 3. Options

| Option | What it reuses | Main cost / risk | Fit with current constraints |
| --- | --- | --- | --- |
| **No desktop yet** | Everything | None now; may slow GUI-led adoption | Strongest fit with unproven demand |
| **Loopback web UI** | `AgentRuntime`, `EventBus`, chat protocol | New local server attack surface; browser chrome, not a native app | Smallest technical step, but requires auth, origin checks, and explicit opt-in |
| **Tauri shell + Node sidecar** | Core packages and chat protocol; system WebView | Rust toolchain, sidecar packaging, signing/notarization, IPC design, lifecycle management | Plausible cross-platform path; memory must be measured |
| **Native SwiftUI + Node sidecar** | Core packages and chat protocol | macOS-only; largest UI investment; diverges from Linux support | Best macOS integration, narrowest audience |
| **Electron** | Core packages, fastest UI iteration | Large download and memory footprint; likely violates performance budgets | Weak fit unless budgets are revised |

All options except "no desktop yet" require a new transport layer and a security review. None should be started without explicit approval.

---

## 4. Recommendation

**Do not build a desktop application now.** The repository has no demonstrated external audience and no desktop demand signal. The existing CLI still has higher-value work: registry publication, contributor onboarding, and real-world usage.

Preserve the current separation so a desktop shell remains possible:

- Keep `AgentRuntime` and all core packages free of terminal I/O and UI rendering.
- Keep UI state flowing through `EventBus` and the chat protocol.
- Keep permission confirmation injectable rather than TUI-bound.
- Do not add a local server "for later" without a concrete consumer and a security design.

Revisit the desktop decision when at least one of these is true:

1. Recurring, specific requests for a graphical interface appear in issues or discussions.
2. A design partner or funded commitment requires a desktop client.
3. CLI adoption is strong enough that a second frontend would not dilute maintenance.

If a desktop effort is approved later, start with a bounded prototype that reuses the chat protocol and `AgentRuntime` over a loopback-only, authenticated transport, and measure startup time and idle memory against the `AGENTS.md` budgets before choosing Tauri, native, or web packaging.

---

## 5. Prerequisites If the Direction Changes

1. **Transport contract**: define a versioned request/response and event-stream protocol over stdio or a loopback socket.
2. **Authentication and origin policy**: never expose an unauthenticated local server; bind to loopback only and verify origins/tokens.
3. **Permission round-trip**: implement a desktop confirmation handler with the same risk semantics as the CLI.
4. **Workspace selection and jail**: route all filesystem access through the existing permission engine and workspace boundary.
5. **Credential handling**: use the existing Keychain/vault layer; never pass raw credentials into prompts or renderer state.
6. **Lifecycle**: define cancellation, session restore, and process cleanup so no daemon or orphaned child process survives app exit.
7. **Packaging**: code signing, notarization, update policy, and a Linux support decision.
8. **Measurement**: startup latency and idle memory on Apple Silicon, compared against the documented budgets.
