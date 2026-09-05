# Berkelium Testing Strategy

Berkelium uses a 4-tier testing hierarchy:

## 1. Unit Tests
Located in `packages/**/__tests__` and `tests/unit`.
Tests isolated units:
- Configuration parsing & schema validation
- Permission evaluation logic
- Theme token resolution
- Context compaction algorithms
- Response normalizer logic
- Tool argument schema validation

## 2. Integration Tests
Located in `tests/integration`.
Tests cross-package integrations:
- Provider adapter -> ResponseNormalizer -> AgentRuntime
- ToolOrchestrator -> PermissionEngine -> SecretRedactor -> Execution
- ContextEngine -> RepoMapper -> Ranking

## 3. Golden Tests
Located in `tests/golden`.
Records canonical prompt input -> AgentEvent trace -> final state to ensure zero regression in multi-turn autonomous loops.

## 4. Berkelium ToolBench
Located in `benchmarks/tool-calling`.
Evaluates tool selection accuracy, argument conformance, retry rates, and latency.
