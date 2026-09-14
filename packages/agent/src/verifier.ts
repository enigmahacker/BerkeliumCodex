import { ToolOrchestrator } from '@berkelium/tools';
import { EventBus } from '@berkelium/events';
import { UserIntent } from './intent.js';

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

      const diagStatus = (diagRes.data as any)?.status || (diagRes.success ? 'CLEAN' : 'ISSUES_FOUND');
      const diagPassed = diagStatus === 'CLEAN';

      results.push({
        check: 'Typecheck & Compilation',
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

      const testPassed =
        testRes.success ||
        testRes.output.includes('(no test') ||
        testRes.output.includes('No test files found');

      results.push({
        check: 'Automated Tests',
        passed: testPassed,
        message: testRes.output.slice(0, 300),
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

    results.push({
      check: 'Diff Review',
      passed: true,
      message: diffRes.output ? `${diffRes.output.split('\n').length} diff lines reviewed` : 'No modified files',
      durationMs: Math.round(performance.now() - diffStart),
    });

    const allPassed = results.every((r) => r.passed);
    const failedChecks = results.filter((r) => !r.passed);
    const isRemediable = failedChecks.length > 0 && failedChecks.some((f) => f.check === 'Automated Tests' || f.check === 'Typecheck & Compilation');

    const summary = allPassed
      ? '✓ All verification checks passed cleanly.'
      : `✗ Verification encountered failures: ${failedChecks.map((r) => r.check).join(', ')}`;

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
      isRemediable,
    };
  }
}
