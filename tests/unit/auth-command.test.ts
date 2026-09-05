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
import { TUIOverlays } from '../../apps/cli/src/tui/overlays.js';

describe('/auth Slash Command & Auth Matrix', () => {
  it('should render authentication overlay with provider statuses', async () => {
    const themeManager = new ThemeManager('berkelium-dark');
    const authStore = new AuthStore();
    const statuses = await authStore.getAllStatuses();

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    TUIOverlays.renderAuth(themeManager, statuses);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('PROVIDER AUTHENTICATION MATRIX');
    expect(output).toContain('NVIDIA');
    expect(output).toContain('OpenRouter');
    expect(output).toContain('Ollama');
    expect(output).toContain('/auth login');

    logSpy.mockRestore();
  });

  it('should handle /auth status and /auth login commands via SlashCommandHandler', async () => {
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

    // 1. /auth
    const handledStatus = await handler.handle('/auth');
    expect(handledStatus).toBe(true);

    // 2. /auth providers
    const handledProviders = await handler.handle('/auth providers');
    expect(handledProviders).toBe(true);

    // 3. /auth login nvidia with inline key
    const handledLogin = await handler.handle('/auth login nvidia nvapi-testkey-12345678');
    expect(handledLogin).toBe(true);

    const key = await authStore.getApiKey('nvidia');
    expect(key).toBe('nvapi-testkey-12345678');

    // 4. /auth logout nvidia
    const handledLogout = await handler.handle('/auth logout nvidia');
    expect(handledLogout).toBe(true);

    logSpy.mockRestore();
  });
});
