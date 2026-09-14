export type FailureCategory =
  | 'syntax'
  | 'type'
  | 'dependency'
  | 'environment'
  | 'permission'
  | 'network'
  | 'model'
  | 'tool'
  | 'test'
  | 'logic';

export interface FailureDiagnosis {
  category: FailureCategory;
  summary: string;
  rootCause: string;
  suggestedFix: string;
  affectedFile?: string;
  affectedLine?: number;
  rawError: string;
  retryable: boolean;
}

export interface FailureObservation {
  id: string;
  timestamp: number;
  category: FailureCategory;
  actionAttempted: string;
  errorMessage: string;
  diagnosis: FailureDiagnosis;
}

export class FailureClassifier {
  /**
   * Classifies a raw error or tool execution failure into one of 10 deterministic failure categories.
   */
  public static classify(error: Error | string, context?: { toolName?: string; args?: any }): FailureDiagnosis {
    const errorStr = typeof error === 'string' ? error : `${error.name}: ${error.message}\n${error.stack || ''}`;
    const lower = errorStr.toLowerCase();

    // 1. Permission errors
    if (
      lower.includes('eacces') ||
      lower.includes('eperm') ||
      lower.includes('permission denied') ||
      lower.includes('boundary violation') ||
      lower.includes('access denied') ||
      lower.includes('policy rejection')
    ) {
      return {
        category: 'permission',
        summary: 'Permission or boundary violation',
        rootCause: 'Operation exceeded permitted security boundaries or lacked filesystem/process authorization.',
        suggestedFix: 'Request appropriate permission level or restrict paths within workspace root.',
        rawError: errorStr,
        retryable: false,
      };
    }

    // 2. Syntax errors
    if (
      lower.includes('syntaxerror') ||
      lower.includes('unexpected token') ||
      lower.includes('parsing error') ||
      lower.includes('unexpected end of input') ||
      lower.includes('unclosed string')
    ) {
      const msgStr = typeof error === 'string' ? error : error.message;
      const match =
        msgStr.match(/at\s+([^:\s()]+):(\d+)(?::(\d+))?/) ||
        msgStr.match(/([^:\s()]+):(\d+):(\d+)/) ||
        errorStr.match(/\((?!.*node_modules)(.*?):(\d+):(\d+)\)/);
      return {
        category: 'syntax',
        summary: 'Syntax parse error',
        rootCause: 'Malformed code syntax, unclosed braces, or invalid language constructs.',
        suggestedFix: 'Review and fix the syntax at the highlighted line before re-running verification.',
        affectedFile: match ? match[1] : undefined,
        affectedLine: match ? parseInt(match[2], 10) : undefined,
        rawError: errorStr,
        retryable: true,
      };
    }

    // 3. Type errors
    if (
      lower.includes('typeerror') ||
      lower.includes('ts2304') ||
      lower.includes('ts2345') ||
      lower.includes('ts2322') ||
      lower.includes('is not assignable to type') ||
      lower.includes('property') && lower.includes('does not exist on type')
    ) {
      return {
        category: 'type',
        summary: 'TypeScript / type check failure',
        rootCause: 'Type signature mismatch, missing interface property, or incompatible type assignment.',
        suggestedFix: 'Align types with definitions or add explicit interface annotations.',
        rawError: errorStr,
        retryable: true,
      };
    }

    // 4. Dependency errors
    if (
      lower.includes('cannot find module') ||
      lower.includes('err_module_not_found') ||
      lower.includes('modulenotfounderror') ||
      lower.includes('package not found') ||
      lower.includes('failed to resolve import')
    ) {
      const modMatch = errorStr.match(/cannot find module ['"]([^'"]+)['"]/i) || errorStr.match(/failed to resolve import ['"]([^'"]+)['"]/i);
      return {
        category: 'dependency',
        summary: 'Missing module or unresolved dependency',
        rootCause: `Dependency ${modMatch ? `"${modMatch[1]}" ` : ''}is not installed or import path is incorrect.`,
        suggestedFix: modMatch ? `Install ${modMatch[1]} or verify local relative path.` : 'Run package manager install or verify import path.',
        rawError: errorStr,
        retryable: true,
      };
    }

    // 5. Network errors
    if (
      lower.includes('econnrefused') ||
      lower.includes('enotfound') ||
      lower.includes('etimedout') ||
      lower.includes('fetch failed') ||
      lower.includes('socket hang up') ||
      lower.includes('502 bad gateway') ||
      lower.includes('503 service unavailable') ||
      lower.includes('504 gateway timeout')
    ) {
      return {
        category: 'network',
        summary: 'Network connectivity or remote endpoint timeout',
        rootCause: 'Remote service is unreachable or DNS resolution failed.',
        suggestedFix: 'Verify network connectivity or try an alternative fallback endpoint.',
        rawError: errorStr,
        retryable: true,
      };
    }

    // 6. Model runtime errors
    if (
      lower.includes('context_length_exceeded') ||
      lower.includes('rate limit') ||
      lower.includes('429') ||
      lower.includes('quota exceeded') ||
      lower.includes('model not found') ||
      lower.includes('maximum context length')
    ) {
      return {
        category: 'model',
        summary: 'Model provider quota or context limit reached',
        rootCause: 'Token budget exceeded model context window or provider rate limits triggered.',
        suggestedFix: 'Run /compact to compress context or route to a higher-capacity model with /model.',
        rawError: errorStr,
        retryable: true,
      };
    }

    // 7. Test failures
    if (
      lower.includes('assertionerror') ||
      lower.includes('failed tests') ||
      lower.includes('test failed') ||
      lower.includes('vitest') && lower.includes('fail') ||
      lower.includes('jest') && lower.includes('fail')
    ) {
      return {
        category: 'test',
        summary: 'Automated test suite regression',
        rootCause: 'Assertion failed during test execution. Implementation output differs from expected contract.',
        suggestedFix: 'Inspect the test assertion diff and adjust implementation logic.',
        rawError: errorStr,
        retryable: true,
      };
    }

    // 8. Environment errors
    if (
      lower.includes('command not found') ||
      lower.includes('enoent') ||
      lower.includes('spawn ') && lower.includes('enoent')
    ) {
      return {
        category: 'environment',
        summary: 'Missing system executable or invalid command',
        rootCause: 'System utility or executable does not exist on the current system PATH.',
        suggestedFix: 'Check required prerequisites with "bk doctor" or use alternative commands.',
        rawError: errorStr,
        retryable: false,
      };
    }

    // 9. Tool execution errors
    if (context?.toolName || lower.includes('tool failed') || lower.includes('schema validation')) {
      return {
        category: 'tool',
        summary: `Tool "${context?.toolName || 'unknown'}" execution failed`,
        rootCause: 'Tool received invalid arguments or underlying system operation failed.',
        suggestedFix: 'Verify tool argument schema conformance.',
        rawError: errorStr,
        retryable: true,
      };
    }

    // 10. Default to logic failure
    return {
      category: 'logic',
      summary: 'Unhandled runtime or logic error',
      rootCause: 'Unexpected runtime state or unhandled edge case in execution logic.',
      suggestedFix: 'Inspect execution stack trace and isolate minimal reproducing condition.',
      rawError: errorStr,
      retryable: true,
    };
  }
}

/**
 * Tracks historical failure observations during a session to prevent repetitive known-bad actions.
 */
export class FailureLedger {
  private observations: FailureObservation[] = [];

  public recordFailure(actionAttempted: string, error: Error | string, context?: { toolName?: string; args?: any }): FailureObservation {
    const diagnosis = FailureClassifier.classify(error, context);
    const observation: FailureObservation = {
      id: `fail_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      category: diagnosis.category,
      actionAttempted,
      errorMessage: typeof error === 'string' ? error : error.message,
      diagnosis,
    };

    this.observations.push(observation);
    return observation;
  }

  public getObservations(): FailureObservation[] {
    return [...this.observations];
  }

  public getRecentFailures(count = 5): FailureObservation[] {
    return this.observations.slice(-count);
  }

  public formatAvoidanceContext(): string {
    if (this.observations.length === 0) return '';

    const recent = this.observations.slice(-4);
    const lines = [
      '### Previous Failure Observations & Avoidance Constraints',
      'The following approaches were attempted and failed. DO NOT repeat these exact failures:',
    ];

    for (const obs of recent) {
      lines.push(
        `- [${obs.category.toUpperCase()}] Attempt: "${obs.actionAttempted.slice(0, 80)}" → Root Cause: ${obs.diagnosis.rootCause} (Fix: ${obs.diagnosis.suggestedFix})`
      );
    }

    return lines.join('\n');
  }

  public clear(): void {
    this.observations = [];
  }
}
