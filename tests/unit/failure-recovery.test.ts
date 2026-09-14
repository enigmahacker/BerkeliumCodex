import { describe, it, expect } from 'vitest';
import { FailureClassifier, FailureLedger } from '@berkelium/agent';

describe('Failure Classifier & Recovery Engine', () => {
  it('should correctly classify syntax errors', () => {
    const error = new SyntaxError('Unexpected token { at src/index.ts:14:2');
    const diag = FailureClassifier.classify(error);
    expect(diag.category).toBe('syntax');
    expect(diag.retryable).toBe(true);
    expect(diag.affectedFile).toBe('src/index.ts');
    expect(diag.affectedLine).toBe(14);
  });

  it('should correctly classify TypeScript type errors', () => {
    const error = 'error TS2345: Argument of type "string" is not assignable to parameter of type "number".';
    const diag = FailureClassifier.classify(error);
    expect(diag.category).toBe('type');
    expect(diag.retryable).toBe(true);
  });

  it('should correctly classify missing dependency errors', () => {
    const error = "Error: Cannot find module '@anthropic-ai/sdk' imported from src/provider.ts";
    const diag = FailureClassifier.classify(error);
    expect(diag.category).toBe('dependency');
    expect(diag.rootCause).toContain('@anthropic-ai/sdk');
    expect(diag.suggestedFix).toContain('@anthropic-ai/sdk');
  });

  it('should correctly classify permission and security violations', () => {
    const error = 'Error: EACCES: permission denied, open /etc/passwd';
    const diag = FailureClassifier.classify(error);
    expect(diag.category).toBe('permission');
    expect(diag.retryable).toBe(false);
  });

  it('should correctly classify network timeouts and connection errors', () => {
    const error = 'FetchError: request to https://api.groq.com/openai/v1/models failed, reason: connect ECONNREFUSED';
    const diag = FailureClassifier.classify(error);
    expect(diag.category).toBe('network');
    expect(diag.retryable).toBe(true);
  });

  it('should correctly classify model quota or context limit exceeded', () => {
    const error = 'API Error: 429 Too Many Requests - context_length_exceeded maximum context length 128000';
    const diag = FailureClassifier.classify(error);
    expect(diag.category).toBe('model');
    expect(diag.suggestedFix).toContain('/compact');
  });

  it('should correctly classify test assertion failures', () => {
    const error = 'AssertionError: expected 45 to deeply equal 50 in tests/unit/math.test.ts';
    const diag = FailureClassifier.classify(error);
    expect(diag.category).toBe('test');
    expect(diag.retryable).toBe(true);
  });

  it('should correctly classify environment missing binary errors', () => {
    const error = 'Error: spawn cargo ENOENT (command not found: cargo)';
    const diag = FailureClassifier.classify(error);
    expect(diag.category).toBe('environment');
    expect(diag.retryable).toBe(false);
  });

  it('should correctly classify tool execution errors', () => {
    const diag = FailureClassifier.classify('Failed to parse JSON arguments', { toolName: 'edit_file' });
    expect(diag.category).toBe('tool');
    expect(diag.summary).toContain('edit_file');
  });

  it('should record failure observations in ledger and format avoidance constraints', () => {
    const ledger = new FailureLedger();

    ledger.recordFailure('edit_file on src/auth.ts with malformed JSON', 'SyntaxError: Unexpected token');
    ledger.recordFailure('pnpm test', 'AssertionError: expected false to be true');

    const observations = ledger.getObservations();
    expect(observations).toHaveLength(2);
    expect(observations[0].category).toBe('syntax');
    expect(observations[1].category).toBe('test');

    const avoidance = ledger.formatAvoidanceContext();
    expect(avoidance).toContain('Previous Failure Observations');
    expect(avoidance).toContain('SYNTAX');
    expect(avoidance).toContain('TEST');
  });
});
