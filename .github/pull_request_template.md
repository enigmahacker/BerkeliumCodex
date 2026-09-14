## Description
<!-- Briefly describe the changes introduced in this pull request and the rationale behind them. -->

## Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 🔒 Security hardening / Vulnerability remediation
- [ ] ⚡ Performance optimization
- [ ] 📚 Documentation update
- [ ] 🧪 Test coverage improvement
- [ ] 🔌 Provider / Tool / Subagent addition

## Architectural Invariants Checked
- [ ] **Provider Neutrality**: No model- or provider-specific logic hardcoded into `AgentRuntime`.
- [ ] **Security Boundaries**: Filesystem, shell, or network actions pass through `PermissionEngine`.
- [ ] **Secret Redaction**: Outputs scrutinized for secrets and credentials.
- [ ] **UI Decoupling**: UI receives state strictly via `EventBus` events.
- [ ] **Typecheck**: `pnpm run typecheck` passes with zero errors.
- [ ] **Tests**: `pnpm test` passes cleanly with new unit/integration tests added.
- [ ] **Benchmarks**: `pnpm run bench` confirms latency and memory budgets are preserved.

## Related Issues
<!-- Link related issues, e.g. Fixes #123 -->

## Verification & Screenshots
<!-- Provide shell logs, test outputs, or terminal recordings verifying the change works as expected. -->
