import { describe, it, expect } from 'vitest';
import { CommandPaletteRenderer } from '../../apps/cli/src/tui/command-palette.js';
import { InputStateMachine } from '../../apps/cli/src/tui/input-state-machine.js';
import { ThemeManager, stripAnsi } from '@berkelium/themes';
import { ConfigManager } from '@berkelium/config';
import { ProviderRouter } from '@berkelium/providers';
import { ToolOrchestrator, ToolRegistry } from '@berkelium/tools';
import { ContextEngine } from '@berkelium/context';
import { AgentRuntime } from '@berkelium/agent';
import { EventBus } from '@berkelium/events';
import { Logger } from '@berkelium/logging';
import { PermissionEngine, SecretRedactor } from '@berkelium/permissions';
import { AuthStore } from '@berkelium/auth';

describe('Interactive Command Palette Pop-up & Alignment', () => {
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

  it('should render pop-up box lines with uniform visible width and aligned borders', () => {
    const context = createTestContext();
    const palette = new CommandPaletteRenderer({ themeManager: context.themeManager, maxVisibleItems: 5 });
    const sm = new InputStateMachine(context);

    sm.setBuffer('/m');
    const matches = sm.getCommandMatches();
    const lines = palette.renderCommandSuggestions(matches, 0, 0, 'm');

    expect(lines.length).toBeGreaterThan(3);

    // Check that every box line has matching visible character length
    const firstLineLen = stripAnsi(lines[0]).length;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('  ↑↓')) continue; // Skip navigation footer
      const visibleLen = stripAnsi(line).length;
      expect(visibleLen).toBe(firstLineLen);
    }
  });

  it('should support left/right cursor movement and history navigation', async () => {
    const context = createTestContext();
    const sm = new InputStateMachine(context);

    // Type 'hello'
    for (const ch of 'hello') {
      await sm.handleKeypress(ch, undefined);
    }
    expect(sm.getBuffer()).toBe('hello');
    expect(sm.getCursorPosition()).toBe(5);

    // Left arrow
    await sm.handleKeypress(undefined, { name: 'left' });
    expect(sm.getCursorPosition()).toBe(4);

    // Right arrow
    await sm.handleKeypress(undefined, { name: 'right' });
    expect(sm.getCursorPosition()).toBe(5);

    // Submit 'hello' to history
    const submitRes = await sm.handleKeypress(undefined, { name: 'enter' });
    expect(submitRes.submittedInput).toBe('hello');

    // Arrow up in Normal mode recalls history
    const histRes = await sm.handleKeypress(undefined, { name: 'up' });
    expect(histRes.buffer).toBe('hello');
  });

  it('should handle Ctrl shortcuts (Ctrl+A, Ctrl+E, Ctrl+U, Ctrl+K, Ctrl+W)', async () => {
    const context = createTestContext();
    const sm = new InputStateMachine(context);

    sm.setBuffer('git commit -m "feat"');
    expect(sm.getCursorPosition()).toBe(20);

    // Ctrl+A -> cursor 0
    await sm.handleKeypress(undefined, { name: 'a', ctrl: true });
    expect(sm.getCursorPosition()).toBe(0);

    // Ctrl+E -> cursor end
    await sm.handleKeypress(undefined, { name: 'e', ctrl: true });
    expect(sm.getCursorPosition()).toBe(20);

    // Ctrl+W -> delete word backwards
    await sm.handleKeypress(undefined, { name: 'w', ctrl: true });
    expect(sm.getBuffer()).toBe('git commit -m');

    // Ctrl+U -> delete to start
    sm.setBuffer('prefix suffix');
    sm.handleKeypress(undefined, { name: 'left' });
    sm.handleKeypress(undefined, { name: 'left' });
    sm.handleKeypress(undefined, { name: 'left' });
    sm.handleKeypress(undefined, { name: 'left' });
    sm.handleKeypress(undefined, { name: 'left' });
    sm.handleKeypress(undefined, { name: 'left' }); // at space
    await sm.handleKeypress(undefined, { name: 'u', ctrl: true });
    expect(sm.getBuffer()).toBe('suffix');
  });
});
