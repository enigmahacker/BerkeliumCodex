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

  it.each(['ask', 'plan', 'review'] as const)('should block every mutation-capable tool in %s mode before execution', async (mode) => {
    const logger = new Logger({ subsystem: 'test' });
    const eventBus = new EventBus();
    const configManager = new ConfigManager(tempDir);
    const config = configManager.getConfig();
    configManager.setSessionOverride({
      agent: { ...config.agent, max_iterations: 1, verify_changes: false },
    });
    const router = new ProviderRouter(configManager.getConfig(), logger);
    const permissionEngine = new PermissionEngine(tempDir, config.permissions, eventBus);
    const orchestrator = new ToolOrchestrator(
      new ToolRegistry(),
      permissionEngine,
      new SecretRedactor(),
      logger,
      tempDir,
      eventBus
    );
    const executeSpy = vi.spyOn(orchestrator, 'execute');
    const contextEngine = new ContextEngine(tempDir, logger);
    const blockedTools = ['write_file', 'run_shell', 'run_process', 'git_commit', 'lint', 'test'];

    vi.spyOn(router, 'resolveTarget').mockReturnValue({
      providerId: 'ollama',
      modelId: 'mock-model',
      provider: {
        isAvailable: async () => true,
        stream: async function* () {
          for (const [index, name] of blockedTools.entries()) {
            yield {
              type: 'tool_call_delta',
              toolCall: {
                index,
                id: `call_${index}`,
                name,
                argumentsDelta: '{}',
              },
            };
          }
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
    });

    runtime.setMode(mode);
    await runtime.executeTask('Create test.txt');

    const messages = runtime.getSessionHistory();
    for (const toolName of blockedTools) {
      const toolMsg = messages.find((m) => m.role === 'tool' && m.name === toolName);
      expect(toolMsg).toBeDefined();
      expect(toolMsg?.content).toContain(`${mode.toUpperCase()} mode is strictly non-destructive`);
      expect(toolMsg?.content).toContain(`Tool "${toolName}" is blocked`);
    }
    expect(executeSpy).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(tempDir, 'test.txt'))).toBe(false);
  });

  it('should enforce non-destructive mode for direct orchestrator callers while allowing reads', async () => {
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
    });
    fs.writeFileSync(path.join(tempDir, 'readable.txt'), 'safe content');
    runtime.setMode('plan');

    const writeResult = await orchestrator.execute({
      callId: 'direct-write',
      toolName: 'write_file',
      args: { path: 'blocked.txt', content: 'must not be written' },
      sessionId: 'direct-policy-test',
    });
    const readResult = await orchestrator.execute({
      callId: 'direct-read',
      toolName: 'read_file',
      args: { path: 'readable.txt' },
      sessionId: 'direct-policy-test',
    });

    expect(writeResult.success).toBe(false);
    expect(writeResult.error).toBe('NON_DESTRUCTIVE_MODE');
    expect(fs.existsSync(path.join(tempDir, 'blocked.txt'))).toBe(false);
    expect(readResult.success).toBe(true);
    expect(readResult.output).toContain('safe content');
  });
});
