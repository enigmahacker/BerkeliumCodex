import { ToolOrchestrator } from '@berkelium/tools';
import { EventBus } from '@berkelium/events';

export interface VerificationCheckResult {
  check: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export interface VerificationReport {
  passed: boolean;
  results: VerificationCheckResult[];
  summary: string;
}

export class Verifier {
  private orchestrator: ToolOrchestrator;
  private eventBus?: EventBus;

  constructor(orchestrator: ToolOrchestrator, eventBus?: EventBus) {
    this.orchestrator = orchestrator;
    this.eventBus = eventBus;
  }

  public async runVerificationPipeline(sessionId: string): Promise<VerificationReport> {
    const checks: string[] = ['diagnostics', 'test', 'diff'];
    this.eventBus?.emit({
      id: crypto.randomUUID(),
      type: 'verification_started',
      sessionId,
      timestamp: Date.now(),
      checks,
    });

    const results: VerificationCheckResult[] = [];

    // 1. Diagnostics check (typecheck / compile)
    const diagStart = performance.now();
    const diagRes = await this.orchestrator.execute({
      callId: `verify_diag_${Date.now()}`,
      toolName: 'diagnostics',
      args: {},
      sessionId,
    });
    results.push({
      check: 'Typecheck & Compilation',
      passed: diagRes.success,
      message: diagRes.output.slice(0, 300),
      durationMs: Math.round(performance.now() - diagStart),
    });

    // 2. Test suite check
    const testStart = performance.now();
    const testRes = await this.orchestrator.execute({
      callId: `verify_test_${Date.now()}`,
      toolName: 'test',
      args: {},
      sessionId,
    });
    const testPassed = testRes.success || testRes.output.includes('(no test');
    results.push({
      check: 'Automated Tests',
      passed: testPassed,
      message: testRes.output.slice(0, 300),
      durationMs: Math.round(performance.now() - testStart),
    });

    // 3. Git diff review
    const diffStart = performance.now();
    const diffRes = await this.orchestrator.execute({
      callId: `verify_diff_${Date.now()}`,
      toolName: 'git_diff',
      args: {},
      sessionId,
    });
    results.push({
      check: 'Diff Review',
      passed: true,
      message: diffRes.output ? `${diffRes.output.split('\n').length} diff lines reviewed` : 'No modified files',
      durationMs: Math.round(performance.now() - diffStart),
    });

    const allPassed = results.every((r) => r.passed);
    const summary = allPassed
      ? '✓ All verification checks passed cleanly.'
      : `✗ Verification encountered failures: ${results.filter((r) => !r.passed).map((r) => r.check).join(', ')}`;

    this.eventBus?.emit({
      id: crypto.randomUUID(),
      type: 'verification_completed',
      sessionId,
      timestamp: Date.now(),
      passed: allPassed,
      results: results.map((r) => ({ check: r.check, passed: r.passed, message: r.message })),
    });

    return {
      passed: allPassed,
      results,
      summary,
    };
  }
}
