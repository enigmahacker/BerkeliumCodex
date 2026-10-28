import { ToolOrchestrator } from '@berkelium/tools';
import { EventBus } from '@berkelium/events';
import { UserIntent } from './intent.js';

export interface VerificationCheckResult {
  check: string;
  passed: boolean;
  status: 'passed' | 'failed' | 'skipped';
  message: string;
  durationMs: number;
}

export interface VerificationReport {
  passed: boolean;
  results: VerificationCheckResult[];
  summary: string;
  isRemediable?: boolean;
}

export interface VerificationOptions {
  intent?: UserIntent;
  filesModified?: string[];
  toolsExecuted?: string[];
  skipTests?: boolean;
}

export class Verifier {
  private orchestrator: ToolOrchestrator;
  private eventBus?: EventBus;

  constructor(orchestrator: ToolOrchestrator, eventBus?: EventBus) {
    this.orchestrator = orchestrator;
    this.eventBus = eventBus;
  }

  public async runVerificationPipeline(
    sessionId: string,
    options: VerificationOptions = {}
  ): Promise<VerificationReport> {
    // 1. If conversational intent, bypass verification completely
    if (options.intent === 'CHAT' || options.intent === 'QUESTION') {
      return {
        passed: true,
        results: [],
        summary: 'Conversational interaction; no verification required.',
        isRemediable: false,
      };
    }

    // 2. Check if documentation-only changes
    const isDocOnly =
      options.filesModified &&
      options.filesModified.length > 0 &&
      options.filesModified.every((f) => f.endsWith('.md') || f.endsWith('.txt') || f.includes('docs/'));

    const checks: string[] = isDocOnly
      ? ['diff']
      : ['diagnostics', options.skipTests ? 'diff' : 'test', 'diff'];

    this.eventBus?.emit({
      id: crypto.randomUUID(),
      type: 'verification_started',
      sessionId,
      timestamp: Date.now(),
      checks,
    });

    const results: VerificationCheckResult[] = [];

    // 3. Diagnostics check (typecheck / compile)
    if (!isDocOnly) {
      const diagStart = performance.now();
      const diagRes = await this.orchestrator.execute({
        callId: `verify_diag_${Date.now()}`,
        toolName: 'diagnostics',
        args: {},
        sessionId,
      });

      const diagStatus = (diagRes.data as any)?.status;
      const diagPassed = diagRes.success && diagStatus !== 'ISSUES_FOUND';

      results.push({
        check: 'Typecheck & Compilation',
        status: diagPassed ? 'passed' : 'failed',
        passed: diagPassed,
        message: diagRes.output.slice(0, 300),
        durationMs: Math.round(performance.now() - diagStart),
      });
    }

    // 4. Test suite check (skip if docs-only or skipTests requested)
    if (!isDocOnly && !options.skipTests) {
      const testStart = performance.now();
      const testRes = await this.orchestrator.execute({
        callId: `verify_test_${Date.now()}`,
        toolName: 'test',
        args: {},
        sessionId,
      });

      const noTestsConfigured = /\(no test|no test files found/i.test(testRes.output);
      const testStatus: VerificationCheckResult['status'] = !testRes.success
        ? 'failed'
        : noTestsConfigured
          ? 'skipped'
          : 'passed';

      results.push({
        check: 'Automated Tests',
        status: testStatus,
        passed: testStatus === 'passed',
        message: noTestsConfigured
          ? 'No test suite ran in this workspace; the test check was skipped.'
          : testRes.output.slice(0, 300),
        durationMs: Math.round(performance.now() - testStart),
      });
    }

    // 5. Git diff review
    const diffStart = performance.now();
    const diffRes = await this.orchestrator.execute({
      callId: `verify_diff_${Date.now()}`,
      toolName: 'git_diff',
      args: {},
      sessionId,
    });

    const diffStatus: VerificationCheckResult['status'] = diffRes.success ? 'passed' : 'skipped';
    results.push({
      check: 'Diff Review',
      status: diffStatus,
      passed: diffRes.success,
      message: diffRes.success
        ? diffRes.output
          ? `${diffRes.output.split('\n').length} diff lines reviewed`
          : 'No modified files'
        : `Diff review unavailable: ${diffRes.error || diffRes.output.slice(0, 200)}`,
      durationMs: Math.round(performance.now() - diffStart),
    });

    const failedChecks = results.filter((r) => r.status === 'failed');
    const skippedChecks = results.filter((r) => r.status === 'skipped');
    const allPassed = failedChecks.length === 0;
    const isRemediable =
      failedChecks.length > 0 &&
      failedChecks.some(
        (f) => f.check === 'Automated Tests' || f.check === 'Typecheck & Compilation'
      );

    let summary: string;
    if (!allPassed) {
      summary = `✗ Verification encountered failures: ${failedChecks.map((r) => r.check).join(', ')}`;
    } else if (skippedChecks.length > 0) {
      summary = `✓ Verification completed without failures. Skipped: ${skippedChecks
        .map((r) => r.check)
        .join(', ')}`;
    } else {
      summary = '✓ All verification checks passed cleanly.';
    }

    this.eventBus?.emit({
      id: crypto.randomUUID(),
      type: 'verification_completed',
      sessionId,
      timestamp: Date.now(),
      passed: allPassed,
      results: results.map((r) => ({
        check: r.check,
        passed: r.passed,
        status: r.status,
        message: r.message,
      })),
    });

    return {
      passed: allPassed,
      results,
      summary,
      isRemediable,
    };
  }
}
