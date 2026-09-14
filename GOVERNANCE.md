# Berkelium Codex Project Governance

**Product**: Berkelium Codex // Neural Coding Runtime  
**Tagline**: *Proudly Indian. Built for the World.*  
**License**: Apache License 2.0  

---

## 1. Governance Principles

Berkelium Codex is an open-source project committed to:
1. **Meritocracy & Transparency**: Decisions are made openly in GitHub issues, pull requests, and discussions based on technical rigor and alignment with architectural invariants.
2. **Provider Neutrality**: No single AI provider, cloud vendor, or hardware architecture will receive exclusive or closed favoritism. Local inference and cloud providers are treated with equal first-class standing.
3. **Developer Safety & Privacy**: User authorization, permission boundaries, credential isolation, and local privacy take precedence over convenience.
4. **Authentic Community**: We strictly prohibit manufactured stars, fake activity, astroturfed contributors, or inflated benchmarks.

---

## 2. Roles and Responsibilities

### Contributors
Anyone who submits issues, reviews code, improves documentation, or contributes pull requests. All contributors agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md).

### Reviewers
Active contributors who have demonstrated deep technical familiarity with one or more Berkelium packages (e.g., `@berkelium/providers`, `@berkelium/permissions`, `@berkelium/agent`). Reviewers are authorized to review PRs and request changes.

### Maintainers
Core stewards responsible for the architectural integrity, releases, security advisories, and day-to-day operations of the repository. Maintainers have write access and merge authority.

Current Project Stewards:
- **Lead Architect & Maintainer**: Berkelium Engineering Group

---

## 3. Decision-Making Process

1. **Bug Fixes & Small Improvements**: Any Maintainer or Reviewer may approve and merge bug fixes and documentation updates once CI passes.
2. **New Providers, Tools, or Subagents**: Require review from at least one Maintainer to verify schema compliance, permission gate coverage, and normalization invariants.
3. **Core Architectural Invariants**: Changes modifying `AgentStateMachine`, `PermissionEngine`, `ToolOrchestrator`, or the 12 system invariants defined in `AGENTS.md` require unanimous Maintainer consensus and thorough regression testing.

---

## 4. Contributing & Onboarding

New contributors are encouraged to start with issues labeled `good first issue` or `help wanted`. Proven contributors who consistently adhere to invariants, write robust tests, and help others will be invited to become Reviewers and Maintainers.
