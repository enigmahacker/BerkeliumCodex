import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { AgentRuntime } from '@berkelium/agent';
import { Verifier } from '../../packages/agent/src/verifier.js';
import { ToolOrchestrator, ToolRegistry } from '@berkelium/tools';
import { PermissionEngine, SecretRedactor } from '@berkelium/permissions';
import { EventBus, TaskOutcomeEvent } from '@berkelium/events';
import { Logger } from '@berkelium/logging';
import { ProviderRouter } from '@berkelium/providers';
import { ConfigManager } from '@berkelium/config';
import { ContextEngine } from '@berkelium/context';

function stubOrchestrator(results: Record<string, unknown>) {
  const calls: string[] = [];
  const execute = vi.fn(async (req: { toolName: string }) => {
    calls.push(req.toolName);
    const result = results[req.toolName];
    if (result === undefined) {
      throw new Error(`Unexpected tool call in test: ${req.toolName}`);
    }
    return typeof result === 'function' ? (result as (r: unknown) => unknown)(req) : result;
  });
  return { execute, calls };
}

describe('Verifier check statuses', () => {
  const allPassing = {
    diagnostics: { success: true, output: 'clean', data: { status: 'CLEAN' } },
    test: { success: true, output: '✓ All tests passed' },
    git_diff: { success: true, output: 'diff --git a/x b/x' },
  };

  it('reports every check as passed when diagnostics, tests, and diff succeed', async () => {
    const verifier = new Verifier(stubOrchestrator(allPassing) as any);

    const report = await verifier.runVerificationPipeline('session', { intent: 'CODE_TASK' });

    expect(report.passed).toBe(true);
    expect(report.results.map((r) => r.status)).toEqual(['passed', 'passed', 'passed']);
    expect(report.summary).toContain('All verification checks passed cleanly');
  });

  it('marks an unconfigured test suite as skipped rather than passed', async () => {
    const verifier = new Verifier(
      stubOrchestrator({
        ...allPassing,
        test: {
          success: true,
          output: '(no test runner or test suite configured in workspace)',
        },
      }) as any
    );

    const report = await verifier.runVerificationPipeline('session', { intent: 'CODE_TASK' });

    const testCheck = report.results.find((r) => r.check === 'Automated Tests');
    expect(testCheck?.status).toBe('skipped');
    expect(testCheck?.passed).toBe(false);
    expect(testCheck?.message).toContain('skipped');
    expect(report.passed).toBe(true);
    expect(report.summary).toContain('Skipped: Automated Tests');
  });

  it('fails the report when diagnostics report issues, and marks it remediable', async () => {
    const verifier = new Verifier(
      stubOrchestrator({
        ...allPassing,
        diagnostics: { success: true, output: 'error TS2322', data: { status: 'ISSUES_FOUND' } },
      }) as any
    );

    const report = await verifier.runVerificationPipeline('session', { intent: 'CODE_TASK' });

    const diagCheck = report.results.find((r) => r.check === 'Typecheck & Compilation');
    expect(diagCheck?.status).toBe('failed');
    expect(report.passed).toBe(false);
    expect(report.isRemediable).toBe(true);
    expect(report.summary).toContain('failures');
  });

  it('marks an unavailable diff review as skipped instead of claiming it passed', async () => {
    const verifier = new Verifier(
      stubOrchestrator({
        ...allPassing,
        git_diff: { success: false, output: 'fatal: not a git repository', error: 'NOT_A_GIT_REPO' },
      }) as any
    );

    const report = await verifier.runVerificationPipeline('session', { intent: 'CODE_TASK' });

    const diffCheck = report.results.find((r) => r.check === 'Diff Review');
    expect(diffCheck?.status).toBe('skipped');
    expect(diffCheck?.message).toContain('Diff review unavailable');
    expect(report.passed).toBe(true);
    expect(report.summary).toContain('Skipped: Diff Review');
  });
});

type ScriptedTurn = unknown[];

function toolCall(index: number, name: string, args: Record<string, unknown>): ScriptedTurn[number] {
  return {
    type: 'tool_call_delta',
    toolCall: { index, id: `call_${index}`, name, argumentsDelta: JSON.stringify(args) },
  };
}

function textTurn(text: string): ScriptedTurn {
  return [
    { type: 'token', text },
    { type: 'finish', finishReason: 'stop' },
  ];
}

function toolTurn(...calls: ScriptedTurn[]): ScriptedTurn {
  return [...calls, { type: 'finish', finishReason: 'tool_calls' }];
}

function createHarness(
  workspaceRoot: string,
  turns: ScriptedTurn[],
  options: { verifyChanges?: boolean } = {}
) {
  const { verifyChanges = true } = options;
  const logger = new Logger({ subsystem: 'workflow-outcomes-test' });
  const eventBus = new EventBus();
  const configManager = new ConfigManager(workspaceRoot);
  const config = configManager.getConfig();
  configManager.setSessionOverride({
    agent: { ...config.agent, max_iterations: 5, verify_changes: verifyChanges, timeout_seconds: 30 },
  });

  const router = new ProviderRouter(configManager.getConfig(), logger);
  const permissionEngine = new PermissionEngine(
    workspaceRoot,
    config.permissions,
    eventBus
  );
  const orchestrator = new ToolOrchestrator(
    new ToolRegistry(),
    permissionEngine,
    new SecretRedactor(),
    logger,
    workspaceRoot,
    eventBus
  );
  const contextEngine = new ContextEngine(workspaceRoot, logger);

  const runtime = new AgentRuntime({
    workspaceRoot,
    configManager,
    router,
    orchestrator,
    contextEngine,
    logger,
    eventBus,
  });

  let turn = 0;
  vi.spyOn(router, 'resolveTarget').mockReturnValue({
    providerId: 'ollama',
    modelId: 'mock-model',
    provider: {
      isAvailable: async () => true,
      stream: async function* () {
        const chunks = turns[Math.min(turn, turns.length - 1)];
        turn++;
        for (const chunk of chunks) {
          yield chunk;
        }
      },
    },
  } as any);

  const toolResults: Record<string, unknown> = {};
  const executed: string[] = [];
  vi.spyOn(orchestrator, 'execute').mockImplementation(async (req) => {
    executed.push(req.toolName);
    const result = toolResults[req.toolName];
    if (result === undefined) {
      throw new Error(`Unexpected tool call in test: ${req.toolName}`);
    }
    return typeof result === 'function' ? (result as (r: unknown) => unknown)(req) : (result as any);
  });

  return { runtime, eventBus, toolResults, executed };
}

function getOutcome(eventBus: EventBus): TaskOutcomeEvent {
  const outcomes = eventBus
    .getHistory()
    .filter((event): event is TaskOutcomeEvent => event.type === 'task_outcome');
  expect(outcomes).toHaveLength(1);
  return outcomes[0];
}

describe('AgentRuntime task outcomes', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-outcomes-test-'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('reports a denied mutation as blocked and never claims a file was modified or verified', async () => {
    const writes = toolTurn(toolCall(0, 'write_file', { path: 'app.ts', content: 'hello' }));
    const { runtime, eventBus, toolResults, executed } = createHarness(tempDir, [
      writes,
      textTurn('I could not write the file.'),
    ]);
    toolResults.write_file = {
      success: false,
      output: 'Permission denied for tool "write_file".',
      error: 'PERMISSION_DENIED',
    };

    await runtime.executeTask('Create app.ts');

    const outcome = getOutcome(eventBus);
    expect(outcome.status).toBe('blocked');
    expect(outcome.applied).toEqual([]);
    expect(outcome.denied).toEqual(['write_file(app.ts)']);
    expect(outcome.failed).toEqual([]);
    expect(outcome.verified).toBeNull();
    expect(outcome.summary).toContain('blocked without applying changes');
    expect(runtime.getState()).toBe('COMPLETED');
    expect(executed).not.toContain('diagnostics');
    expect(executed).not.toContain('test');
  });

  it('reports partial completion when some actions apply and others are denied', async () => {
    const writes = toolTurn(
      toolCall(0, 'write_file', { path: 'app.ts', content: 'hello' }),
      toolCall(1, 'run_shell', { command: 'sudo rm -rf /' })
    );
    const { runtime, eventBus, toolResults } = createHarness(
      tempDir,
      [writes, textTurn('Wrote the file but the command was denied.')],
      { verifyChanges: false }
    );
    toolResults.write_file = { success: true, output: 'Wrote app.ts' };
    toolResults.run_shell = {
      success: false,
      output: 'Permission denied for tool "run_shell".',
      error: 'PERMISSION_DENIED',
    };

    await runtime.executeTask('Create app.ts');

    const outcome = getOutcome(eventBus);
    expect(outcome.status).toBe('partial');
    expect(outcome.applied).toEqual(['write_file(app.ts)']);
    expect(outcome.denied).toEqual(['run_shell(sudo rm -rf /)']);
    expect(outcome.verified).toBeNull();
    expect(outcome.summary).toContain('partially completed');
  });

  it('reports completed without tool actions when an actionable prompt needs no tools', async () => {
    const { runtime, eventBus } = createHarness(tempDir, [textTurn('No changes were necessary.')]);

    await runtime.executeTask('Create app.ts');

    const outcome = getOutcome(eventBus);
    expect(outcome.status).toBe('completed');
    expect(outcome.applied).toEqual([]);
    expect(outcome.verified).toBeNull();
    expect(outcome.summary).toContain('without tool actions');
  });

  it('verifies a successful mutation and reports verification as passed', async () => {
    const writes = toolTurn(toolCall(0, 'write_file', { path: 'app.ts', content: 'hello' }));
    const { runtime, eventBus, toolResults } = createHarness(tempDir, [
      writes,
      textTurn('Done.'),
    ]);
    toolResults.write_file = { success: true, output: 'Wrote app.ts' };
    toolResults.diagnostics = { success: true, output: 'clean', data: { status: 'CLEAN' } };
    toolResults.test = { success: true, output: '✓ All tests passed' };
    toolResults.git_diff = { success: true, output: 'diff --git a/app.ts b/app.ts' };

    await runtime.executeTask('Create app.ts');

    const outcome = getOutcome(eventBus);
    expect(outcome.status).toBe('completed');
    expect(outcome.applied).toEqual(['write_file(app.ts)']);
    expect(outcome.verified).toBe(true);
    expect(outcome.summary).toContain('verification passed');
    expect(outcome.summary).not.toContain('skipped');

    const verificationEvent = eventBus
      .getHistory()
      .find((event) => event.type === 'verification_completed') as any;
    expect(verificationEvent.results.map((r: any) => r.status)).toEqual([
      'passed',
      'passed',
      'passed',
    ]);
  });

  it('does not claim verification passed cleanly when checks were skipped', async () => {
    const writes = toolTurn(toolCall(0, 'write_file', { path: 'app.ts', content: 'hello' }));
    const { runtime, eventBus, toolResults } = createHarness(tempDir, [
      writes,
      textTurn('Done.'),
    ]);
    toolResults.write_file = { success: true, output: 'Wrote app.ts' };
    toolResults.diagnostics = { success: true, output: 'clean', data: { status: 'CLEAN' } };
    toolResults.test = {
      success: true,
      output: '(no test runner or test suite configured in workspace)',
    };
    toolResults.git_diff = { success: true, output: 'diff --git a/app.ts b/app.ts' };

    await runtime.executeTask('Create app.ts');

    const outcome = getOutcome(eventBus);
    expect(outcome.status).toBe('completed');
    expect(outcome.verified).toBe(true);
    expect(outcome.summary).toContain('verification passed with skipped checks');
  });
});
