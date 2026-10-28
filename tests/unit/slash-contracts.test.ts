import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { ThemeManager } from '@berkelium/themes';
import { AuthStore } from '@berkelium/auth';
import { ConfigManager } from '@berkelium/config';
import { ProviderRouter, Message } from '@berkelium/providers';
import { ToolOrchestrator, ToolRegistry } from '@berkelium/tools';
import { ContextEngine } from '@berkelium/context';
import { AgentRuntime, SessionManager } from '@berkelium/agent';
import { EventBus } from '@berkelium/events';
import { Logger } from '@berkelium/logging';
import { PermissionEngine, SecretRedactor } from '@berkelium/permissions';
import { SlashCommandHandler } from '../../apps/cli/src/tui/slash-commands.js';

describe('Slash command contract resolution', () => {
  let tmpDir: string;
  let runtime: AgentRuntime;
  let sessionManager: SessionManager;
  let handler: SlashCommandHandler;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-slash-contracts-'));
    const logger = new Logger({ level: 'error', subsystem: 'test' });
    const eventBus = new EventBus();
    const configManager = new ConfigManager(tmpDir);
    const authStore = new AuthStore({ vaultPath: path.join(tmpDir, 'vault.json') });
    const themeManager = new ThemeManager('berkelium-dark');
    const router = new ProviderRouter(configManager.getConfig(), logger);
    const permissionEngine = new PermissionEngine(tmpDir, configManager.getConfig().permissions, eventBus);
    const orchestrator = new ToolOrchestrator(
      new ToolRegistry(),
      permissionEngine,
      new SecretRedactor(),
      logger,
      tmpDir,
      eventBus
    );
    const contextEngine = new ContextEngine(tmpDir, logger);

    runtime = new AgentRuntime({
      workspaceRoot: tmpDir,
      configManager,
      router,
      orchestrator,
      contextEngine,
      logger,
      eventBus,
    });

    sessionManager = new SessionManager(path.join(tmpDir, 'sessions'));
    handler = new SlashCommandHandler(
      runtime,
      themeManager,
      configManager,
      router,
      orchestrator,
      contextEngine,
      authStore,
      sessionManager
    );

    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function output(): string {
    return logSpy.mock.calls.map((call) => call.join(' ')).join('\n');
  }

  it('routes registered aliases to their canonical handlers', async () => {
    await handler.handle('/abort');
    expect(output()).toContain('Stopped active model generation');
    expect(output()).not.toContain('Unknown slash command');

    logSpy.mockClear();
    await handler.handle('/jobs');
    expect(output()).not.toContain('Unknown slash command');
  });

  it('lists persisted sessions through /session list', async () => {
    const session = sessionManager.createSession('test-model', 'test-provider', tmpDir);
    await sessionManager.saveSession(session);

    await handler.handle('/session list');

    expect(output()).toContain('PERSISTENT SESSIONS');
    expect(output()).toContain(session.id);
  });

  it('resumes a persisted session and reports missing sessions truthfully', async () => {
    const session = sessionManager.createSession('restored-model', 'test-provider', tmpDir);
    session.messages = [{ role: 'user', content: 'earlier request' }];
    await sessionManager.saveSession(session);

    await handler.handle(`/session resume ${session.id}`);

    expect(output()).toContain(`Resumed session: ${session.id}`);
    expect(runtime.getActiveModel()).toBe('restored-model');
    expect(runtime.getSessionHistory()).toHaveLength(1);

    logSpy.mockClear();
    await handler.handle('/session resume missing-session');
    expect(output()).toContain('not found');
  });

  it('actually clears conversation history on /reset', async () => {
    const session = sessionManager.createSession('test-model', 'test-provider', tmpDir);
    session.messages = [{ role: 'user', content: 'earlier request' }];
    await sessionManager.saveSession(session);
    await runtime.resumeFromSession(session);
    expect(runtime.getSessionHistory()).toHaveLength(1);

    await handler.handle('/reset');

    expect(runtime.getSessionHistory()).toHaveLength(0);
    expect(output()).toContain('Conversation history and failure context cleared');
  });

  it('applies /compact to the live conversation instead of reporting a dry run', async () => {
    const session = sessionManager.createSession('test-model', 'test-provider', tmpDir);
    const messages: Message[] = [{ role: 'user', content: 'start the task' }];
    for (let i = 0; i < 12; i++) {
      messages.push({
        role: 'assistant',
        content: `step ${i}`,
        tool_calls: [{ id: `call_${i}`, name: 'read_file', arguments: { path: `file_${i}.ts` } }],
      });
      messages.push({
        role: 'tool',
        tool_call_id: `call_${i}`,
        name: 'read_file',
        content: `result ${i}`,
      });
    }
    session.messages = messages;
    await runtime.resumeFromSession(session);

    const before = runtime.getSessionHistory().length;
    await handler.handle('/compact');

    expect(runtime.getSessionHistory().length).toBeLessThan(before);
    expect(output()).toContain('Context compacted');
  });

  it('renders /context utilization from the real prompt assembly', async () => {
    await handler.handle('/context');

    expect(output()).toContain('Context Utilization');
    expect(output()).toContain('System');
    expect(output()).toContain('Limit');
  });
});
