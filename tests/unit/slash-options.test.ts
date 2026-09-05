import { describe, it, expect, vi } from 'vitest';
import { ThemeManager } from '@berkelium/themes';
import { AuthStore } from '@berkelium/auth';
import { ConfigManager } from '@berkelium/config';
import { ProviderRouter } from '@berkelium/providers';
import { ToolOrchestrator, ToolRegistry } from '@berkelium/tools';
import { ContextEngine } from '@berkelium/context';
import { AgentRuntime } from '@berkelium/agent';
import { EventBus } from '@berkelium/events';
import { Logger } from '@berkelium/logging';
import { PermissionEngine, SecretRedactor } from '@berkelium/permissions';
import { SlashCommandHandler } from '../../apps/cli/src/tui/slash-commands.js';

describe('Slash Command Autocompletion & Options Palette', () => {
  it('should provide full list of command completions when / is typed or empty', () => {
    const logger = new Logger({ subsystem: 'test' });
    const eventBus = new EventBus();
    const configManager = new ConfigManager();
    const authStore = new AuthStore();
    const themeManager = new ThemeManager('berkelium-dark');
    const router = new ProviderRouter(configManager.getConfig(), logger);
    const permissionEngine = new PermissionEngine(
      configManager.getWorkspaceRoot(),
      configManager.getConfig().permissions,
      eventBus
    );
    const orchestrator = new ToolOrchestrator(
      new ToolRegistry(),
      permissionEngine,
      new SecretRedactor(),
      logger,
      configManager.getWorkspaceRoot(),
      eventBus
    );
    const contextEngine = new ContextEngine(configManager.getWorkspaceRoot(), logger);
    const runtime = new AgentRuntime({
      workspaceRoot: configManager.getWorkspaceRoot(),
      configManager,
      router,
      orchestrator,
      contextEngine,
      logger,
      eventBus,
    });

    const handler = new SlashCommandHandler(
      runtime,
      themeManager,
      configManager,
      router,
      orchestrator,
      contextEngine,
      authStore
    );

    const allCompletions = handler.getCompletions('/');
    expect(allCompletions).toContain('/help');
    expect(allCompletions).toContain('/auth');
    expect(allCompletions).toContain('/model');
    expect(allCompletions).toContain('/models');
    expect(allCompletions).toContain('/system');
    expect(allCompletions).toContain('/matrix');
    expect(allCompletions).toContain('/theme');

    const filtered = handler.getCompletions('/m');
    expect(filtered).toContain('/model');
    expect(filtered).toContain('/models');
    expect(filtered).toContain('/matrix');
    expect(filtered).not.toContain('/auth');
  });

  it('should render options palette when / or /help or /? is entered', async () => {
    const logger = new Logger({ subsystem: 'test' });
    const eventBus = new EventBus();
    const configManager = new ConfigManager();
    const authStore = new AuthStore();
    const themeManager = new ThemeManager('berkelium-dark');
    const router = new ProviderRouter(configManager.getConfig(), logger);
    const permissionEngine = new PermissionEngine(
      configManager.getWorkspaceRoot(),
      configManager.getConfig().permissions,
      eventBus
    );
    const orchestrator = new ToolOrchestrator(
      new ToolRegistry(),
      permissionEngine,
      new SecretRedactor(),
      logger,
      configManager.getWorkspaceRoot(),
      eventBus
    );
    const contextEngine = new ContextEngine(configManager.getWorkspaceRoot(), logger);
    const runtime = new AgentRuntime({
      workspaceRoot: configManager.getWorkspaceRoot(),
      configManager,
      router,
      orchestrator,
      contextEngine,
      logger,
      eventBus,
    });

    const handler = new SlashCommandHandler(
      runtime,
      themeManager,
      configManager,
      router,
      orchestrator,
      contextEngine,
      authStore
    );

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await handler.handle('/');
    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('BERKELIUM COMMAND OPTIONS');
    expect(output).toContain('AI & MODELS');
    expect(output).toContain('DEV & CODE');
    expect(output).toContain('SYSTEM & SECURITY');
    expect(output).toContain('CORE & THEME');
    expect(output).toContain('/auth');
    expect(output).toContain('/matrix');

    logSpy.mockRestore();
  });
});
