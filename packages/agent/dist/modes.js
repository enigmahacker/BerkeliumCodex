export const AGENT_MODES = {
    ask: {
        name: 'ask',
        description: 'Advisory and Q&A mode. Discuss ideas, architecture, and explain concepts without modifying files.',
        isDestructiveAllowed: false,
        promptInstructions: `
MODE: ASK
- Focus on answering questions, advising on technical design, and explaining concepts.
- Provide clear, direct, and actionable explanations.
- Do not execute code mutations unless the user explicitly switches to a build mode or asks to write.
`.trim(),
    },
    plan: {
        name: 'plan',
        description: 'Non-destructive planning mode. Inspects repo, analyzes dependencies, and creates implementation plans.',
        isDestructiveAllowed: false,
        promptInstructions: `
MODE: PLAN (Strictly Non-Destructive)
- Inspect the repository and understand existing architecture.
- Locate relevant files and identify dependencies.
- Determine implementation strategy and highlight potential risks.
- Produce a concrete step-by-step plan:
  1. Goal
  2. Files likely affected
  3. Implementation steps
  4. Risks & safeguards
  5. Verification strategy
- NO FILES MUST BE MODIFIED in this mode. Do not execute file writes, edits, deletions, or mutating shell commands.
- Wait for explicit user authorization and mode switch to build before making changes.
`.trim(),
    },
    build: {
        name: 'build',
        description: 'Primary engineering mode. Understand, inspect, plan, authorize, execute, verify, test, review, and fix.',
        isDestructiveAllowed: true,
        promptInstructions: `
MODE: BUILD
- Primary autonomous engineering loop: UNDERSTAND -> INSPECT -> PLAN -> ASK/AUTHORIZE -> EXECUTE -> VERIFY -> TEST -> REVIEW -> FIX -> VERIFY AGAIN.
- Always inspect files before modifying them.
- Apply minimal, surgical edits.
- Run tests and verifications to confirm correctness.
`.trim(),
    },
    debug: {
        name: 'debug',
        description: 'Investigation and debugging mode. Reproduce, trace root cause, patch, test, and regression test.',
        isDestructiveAllowed: true,
        promptInstructions: `
MODE: DEBUG
- Systematic debugging workflow: REPRODUCE -> CAPTURE ERROR -> TRACE ROOT CAUSE -> INSPECT CODE -> PATCH -> TEST -> REGRESSION TEST.
- Clearly distinguish between:
  [OBSERVED]: Concrete error outputs, logs, stack traces.
  [INFERRED]: Hypotheses deduced from evidence.
  [UNKNOWN]: Things requiring further investigation.
- Never claim a bug is fixed until verification passes.
`.trim(),
    },
    review: {
        name: 'review',
        description: 'Code and security review mode. Inspect diffs, identify vulnerabilities, code smells, and quality issues.',
        isDestructiveAllowed: false,
        promptInstructions: `
MODE: REVIEW
- Inspect Git diffs, recent changes, and code quality.
- Identify bugs, edge cases, security vulnerabilities, performance bottlenecks, and style deviations.
- Prioritize findings: CRITICAL, HIGH, MEDIUM, LOW.
- Provide constructive suggestions without modifying files directly unless requested.
`.trim(),
    },
    test: {
        name: 'test',
        description: 'Test-driven validation mode. Runs test suites, analyzes failures, fixes tests/code, and runs regressions.',
        isDestructiveAllowed: true,
        promptInstructions: `
MODE: TEST
- Test engineering workflow: Run tests -> Capture failure -> Analyze -> Patch -> Run targeted test -> Run regression suite.
- Automatically detect test runner (Vitest, Jest, Pytest, Cargo test, Go test, etc.).
- Bound retries and never fabricate test success.
`.trim(),
    },
    refactor: {
        name: 'refactor',
        description: 'Refactoring mode. Clean code structure, eliminate debt, preserve behavior with zero regression.',
        isDestructiveAllowed: true,
        promptInstructions: `
MODE: REFACTOR
- Clean architecture and code quality improvement.
- Ensure zero functional regressions.
- Verify tests pass before and after every structural change.
`.trim(),
    },
};
export function isValidAgentMode(mode) {
    return mode in AGENT_MODES;
}
//# sourceMappingURL=modes.js.map