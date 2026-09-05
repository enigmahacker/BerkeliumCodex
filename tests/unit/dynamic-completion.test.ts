import { describe, it, expect } from 'vitest';
import { CompletionEngine } from '../../apps/cli/src/commands/completion.js';
import { CommandRegistry } from '../../apps/cli/src/commands/registry.js';
import { ThemeManager } from '@berkelium/themes';
import { ConfigManager } from '@berkelium/config';
import { ProviderRouter } from '@berkelium/providers';
import { ToolOrchestrator, ToolRegistry } from '@berkelium/tools';
import { ContextEngine } from '@berkelium/context';
import { AgentRuntime } from '@berkelium/agent';
import { EventBus } from '@berkelium/events';
import { Logger } from '@berkelium/logging';
import { PermissionEngine, SecretRedactor } from '@berkelium/permissions';
import { AuthStore } from '@berkelium/auth';

describe('Dynamic Completion Engine', () => {
  function createTestContext() {
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

    return {
      runtime,
      themeManager,
      configManager,
      router,
      orchestrator,
      contextEngine,
      authStore,
    };
  }

  it('should provide dynamic completions for themes', async () => {
    const context = createTestContext();
    const registry = CommandRegistry.getInstance();
    const themeCmd = registry.get('theme')!;

    const results = await CompletionEngine.getArgumentSuggestions(context, themeCmd, 0, 'mat');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].value).toBe('matrix');
  });

  it('should provide dynamic completions for providers', async () => {
    const context = createTestContext();
    const registry = CommandRegistry.getInstance();
    const provCmd = registry.get('provider')!;

    const results = await CompletionEngine.getArgumentSuggestions(context, provCmd, 0, 'open');
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.some((r) => r.value === 'openrouter')).toBe(true);
    expect(results.some((r) => r.value === 'openai')).toBe(true);
  });

  it('should provide dynamic completions for tools', async () => {
    const context = createTestContext();
    const registry = CommandRegistry.getInstance();
    const toolsCmd = registry.get('tools')!;

    const results = await CompletionEngine.getArgumentSuggestions(context, toolsCmd, 0, 'read');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.value === 'read_file')).toBe(true);
  });

  it('should provide dynamic completions for model aliases and providers', async () => {
    const context = createTestContext();
    const registry = CommandRegistry.getInstance();
    const modelCmd = registry.get('model')!;

    const results = await CompletionEngine.getArgumentSuggestions(context, modelCmd, 0, 'cod');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.value === 'coding')).toBe(true);
  });
});
