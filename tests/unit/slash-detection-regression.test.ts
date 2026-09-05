import { describe, it, expect } from 'vitest';
import { InputStateMachine } from '../../apps/cli/src/tui/input-state-machine.js';
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

describe('Slash Detection Regression Safety', () => {
  function createTestStateMachine() {
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

    return new InputStateMachine({
      runtime,
      themeManager,
      configManager,
      router,
      orchestrator,
      contextEngine,
      authStore,
    });
  }

  it('must NOT trigger slash command mode for normal natural language containing slashes', () => {
    const sm = createTestStateMachine();

    const naturalInputs = [
      'explain /etc/hosts',
      'search for /src/auth in repo',
      'how do I run tests/unit/index.ts?',
      'check if 1/2 is true',
      'visit https://github.com/berkelium',
    ];

    for (const input of naturalInputs) {
      sm.setBuffer(input);
      expect(sm.getMode()).toBe('Normal');
    }
  });

  it('must trigger slash command mode when leading slash is used with optional whitespace', () => {
    const sm = createTestStateMachine();

    sm.setBuffer('/model');
    expect(sm.getMode()).toBe('SlashCommand');

    sm.setBuffer('   /theme');
    expect(sm.getMode()).toBe('SlashCommand');

    sm.setBuffer('/model coding');
    expect(sm.getMode()).toBe('SlashArgument');
  });
});
