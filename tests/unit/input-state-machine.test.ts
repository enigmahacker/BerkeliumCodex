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

describe('InputStateMachine (Slash Mode, Tab Complete, Keyboard Nav)', () => {
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

    const context = {
      runtime,
      themeManager,
      configManager,
      router,
      orchestrator,
      contextEngine,
      authStore,
    };

    return new InputStateMachine(context);
  }

  it('should start in Normal mode for empty or regular text', async () => {
    const sm = createTestStateMachine();
    expect(sm.getMode()).toBe('Normal');

    await sm.handleKeypress('h', undefined);
    await sm.handleKeypress('i', undefined);
    expect(sm.getBuffer()).toBe('hi');
    expect(sm.getMode()).toBe('Normal');
  });

  it('should transition to SlashCommand mode when / is typed as first token', async () => {
    const sm = createTestStateMachine();
    const res = await sm.handleKeypress('/', undefined);

    expect(res.mode).toBe('SlashCommand');
    expect(res.shouldRenderPalette).toBe(true);
    expect(res.commandMatches.length).toBeGreaterThan(10);
  });

  it('should filter commands dynamically as characters are typed', async () => {
    const sm = createTestStateMachine();
    await sm.handleKeypress('/', undefined);
    const res = await sm.handleKeypress('m', undefined);

    expect(res.mode).toBe('SlashCommand');
    expect(res.commandMatches.some((c) => c.command.name === 'model')).toBe(true);
    expect(res.commandMatches.some((c) => c.command.name === 'models')).toBe(true);
  });

  it('should navigate suggestions with ArrowDown and ArrowUp', async () => {
    const sm = createTestStateMachine();
    await sm.handleKeypress('/', undefined);

    const res1 = await sm.handleKeypress(undefined, { name: 'down' });
    expect(res1.selectedIndex).toBe(1);

    const res2 = await sm.handleKeypress(undefined, { name: 'up' });
    expect(res2.selectedIndex).toBe(0);
  });

  it('should complete highlighted command on Tab without executing', async () => {
    const sm = createTestStateMachine();
    sm.setBuffer('/mod');
    expect(sm.getMode()).toBe('SlashCommand');

    const res = await sm.handleKeypress(undefined, { name: 'tab' });
    expect(res.buffer).toBe('/model ');
    expect(res.submittedInput).toBeUndefined(); // Must NOT execute!
  });

  it('should transition to SlashArgument mode on space after command', async () => {
    const sm = createTestStateMachine();
    sm.setBuffer('/model ');

    // Allow async completion recomputation
    const res = await sm.handleKeypress(undefined, { name: 'down' });
    expect(res.mode).toBe('SlashArgument');
    expect(res.activeCommand?.name).toBe('model');
  });

  it('should close suggestions on Escape while preserving input', async () => {
    const sm = createTestStateMachine();
    sm.setBuffer('/theme');
    expect(sm.getMode()).toBe('SlashCommand');

    const res = await sm.handleKeypress(undefined, { name: 'escape' });
    expect(res.mode).toBe('Normal');
    expect(res.buffer).toBe('/theme'); // Buffer must be preserved!
    expect(res.shouldRenderPalette).toBe(false);
  });
});
