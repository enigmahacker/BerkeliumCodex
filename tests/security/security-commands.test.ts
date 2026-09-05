import { describe, it, expect, vi } from 'vitest';
import { CommandRegistry } from '../../apps/cli/src/commands/registry.js';
import { SlashCommandHandler } from '../../apps/cli/src/tui/slash-commands.js';
import { AgentRuntime } from '@berkelium/agent';
import { ThemeManager } from '@berkelium/themes';
import { ConfigManager } from '@berkelium/config';
import { ProviderRouter } from '@berkelium/providers';
import { ToolOrchestrator } from '@berkelium/tools';
import { ContextEngine } from '@berkelium/context';
import { AuthStore } from '@berkelium/auth';

describe('Security Hardening: CLI Security Commands (/security, /security audit)', () => {
  it('should have /security registered in CommandRegistry with aliases and options', () => {
    const registry = CommandRegistry.getInstance();
    const cmd = registry.get('security');
    expect(cmd).toBeDefined();
    expect(cmd?.name).toBe('security');
    expect(cmd?.aliases).toContain('sec');
    expect(cmd?.aliases).toContain('guard');
    expect(cmd?.category).toBe('PERMISSIONS');
  });

  it('should handle /security and /security audit in SlashCommandHandler without throwing', async () => {
    const mockRuntime = {} as unknown as AgentRuntime;
    const themeManager = new ThemeManager();
    const configManager = new ConfigManager('/tmp');
    const router = {} as unknown as ProviderRouter;
    const orchestrator = {} as unknown as ToolOrchestrator;
    const contextEngine = {} as unknown as ContextEngine;
    const authStore = {} as unknown as AuthStore;

    const handler = new SlashCommandHandler(
      mockRuntime,
      themeManager,
      configManager,
      router,
      orchestrator,
      contextEngine,
      authStore
    );

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const res1 = await handler.handle('/security');
      expect(res1).toBe(true);

      const res2 = await handler.handle('/security audit');
      expect(res2).toBe(true);

      const res3 = await handler.handle('/permissions');
      expect(res3).toBe(true);
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
