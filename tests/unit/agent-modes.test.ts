import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { AGENT_MODES, AgentMode } from '../../packages/agent/src/modes.js';
import { AgentRuntime } from '@berkelium/agent';
import { ToolOrchestrator, ToolRegistry } from '@berkelium/tools';
import { PermissionEngine, SecretRedactor } from '@berkelium/permissions';
import { EventBus } from '@berkelium/events';
import { Logger } from '@berkelium/logging';
import { ProviderRouter } from '@berkelium/providers';
import { ConfigManager } from '@berkelium/config';
import { ContextEngine } from '@berkelium/context';

describe('Agent Modes & PLAN Mode Non-Destructive Invariant', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-modes-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should define all 7 required agent modes with metadata', () => {
    const requiredModes: AgentMode[] = ['ask', 'plan', 'build', 'debug', 'review', 'test', 'refactor'];
    for (const mode of requiredModes) {
      expect(AGENT_MODES[mode]).toBeDefined();
      expect(AGENT_MODES[mode].name).toBe(mode);
      expect(typeof AGENT_MODES[mode].description).toBe('string');
      expect(typeof AGENT_MODES[mode].promptInstructions).toBe('string');
      expect(AGENT_MODES[mode].promptInstructions.length).toBeGreaterThan(10);
    }
  });

  it('should mark plan mode as non-destructive and require approval', () => {
    expect(AGENT_MODES.plan.isDestructiveAllowed).toBe(false);
    expect(AGENT_MODES.ask.isDestructiveAllowed).toBe(false);
    expect(AGENT_MODES.build.isDestructiveAllowed).toBe(true);
  });

  it('should allow runtime to set and get agent mode and dispatch mode_changed event', () => {
    const logger = new Logger({ subsystem: 'test' });
    const eventBus = new EventBus();
    const configManager = new ConfigManager(tempDir);
    const router = new ProviderRouter(configManager.getConfig(), logger);
    const permissionEngine = new PermissionEngine(tempDir, configManager.getConfig().permissions, eventBus);
    const orchestrator = new ToolOrchestrator(
      new ToolRegistry(),
      permissionEngine,
      new SecretRedactor(),
      logger,
      tempDir,
      eventBus
    );
    const contextEngine = new ContextEngine(tempDir, logger);

    const runtime = new AgentRuntime({
      workspaceRoot: tempDir,
      configManager,
      router,
      orchestrator,
      contextEngine,
      logger,
      eventBus,
      maxIterations: 10,
    });

    expect(runtime.getMode()).toBe('build');

    let capturedEvent: any = null;
    eventBus.on('mode_changed', (evt) => {
      capturedEvent = evt;
    });

    runtime.setMode('plan');
    expect(runtime.getMode()).toBe('plan');
    expect(capturedEvent).toBeDefined();
    expect(capturedEvent.newMode).toBe('plan');
    expect(capturedEvent.previousMode).toBe('build');
  });

  it('should block mutating tools in PLAN mode and inform user', async () => {
    const logger = new Logger({ subsystem: 'test' });
    const eventBus = new EventBus();
    const configManager = new ConfigManager(tempDir);
    const router = new ProviderRouter(configManager.getConfig(), logger);
    const permissionEngine = new PermissionEngine(tempDir, configManager.getConfig().permissions, eventBus);
    const orchestrator = new ToolOrchestrator(
      new ToolRegistry(),
      permissionEngine,
      new SecretRedactor(),
      logger,
      tempDir,
      eventBus
    );
    const contextEngine = new ContextEngine(tempDir, logger);

    // Mock resolveTarget on router to stream a tool call delta to write_file
    vi.spyOn(router, 'resolveTarget').mockReturnValue({
      providerId: 'ollama',
      modelId: 'mock-model',
      provider: {
        stream: async function* () {
          yield {
            type: 'tool_call_delta',
            toolCall: {
              index: 0,
              id: 'call_1',
              name: 'write_file',
              argumentsDelta: JSON.stringify({ path: 'test.txt', content: 'hello' }),
            },
          };
          yield {
            type: 'finish',
            finishReason: 'tool_calls',
          };
        },
      },
    } as any);

    const runtime = new AgentRuntime({
      workspaceRoot: tempDir,
      configManager,
      router,
      orchestrator,
      contextEngine,
      logger,
      eventBus,
      maxIterations: 2,
    });

    runtime.setMode('plan');

    // Run a step in plan mode
    await runtime.executeTask('Create test.txt');

    // Verify messages: write_file tool call was intercepted and blocked
    const messages = runtime.getSessionHistory();
    const toolMsg = messages.find((m) => m.role === 'tool' && m.name === 'write_file');
    expect(toolMsg).toBeDefined();
    expect(toolMsg?.content).toContain('PLAN mode is strictly non-destructive');
    expect(toolMsg?.content).toContain('Tool "write_file" is blocked');
  });
});
