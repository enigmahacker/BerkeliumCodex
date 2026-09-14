import { describe, it, expect } from 'vitest';
import { SubagentManager, SubagentRole } from '@berkelium/agent';
import { ToolOrchestrator, ToolRegistry } from '@berkelium/tools';
import { ProviderRouter } from '@berkelium/providers';
import { Logger } from '@berkelium/logging';
import { ConfigManager } from '@berkelium/config';
import { PermissionEngine, SecretRedactor } from '@berkelium/permissions';

describe('Specialized Scoped Subagents Suite', () => {
  const configManager = new ConfigManager();
  const logger = new Logger({ subsystem: 'subagents-test' });
  const permEngine = new PermissionEngine(process.cwd(), configManager.getConfig().permissions);
  const router = new ProviderRouter(configManager.getConfig(), logger);
  const registry = new ToolRegistry();
  const redactor = new SecretRedactor();
  const orchestrator = new ToolOrchestrator(
    registry,
    permEngine,
    redactor,
    logger,
    process.cwd()
  );
  const manager = new SubagentManager(orchestrator, router, logger);

  const expectedRoles: SubagentRole[] = [
    'explorer',
    'architect',
    'coder',
    'debugger',
    'tester',
    'reviewer',
    'security',
    'performance',
    'documentation',
  ];

  it('should define all 9 specialized subagents with explicit configurations', () => {
    const list = manager.listSubagents();
    expect(list).toHaveLength(9);

    for (const role of expectedRoles) {
      const config = manager.getSubagentConfig(role);
      expect(config).toBeDefined();
      expect(config?.role).toBe(role);
      expect(config?.description).toBeTruthy();
      expect(config?.systemPrompt).toBeTruthy();
      expect(config?.allowedTools.length).toBeGreaterThan(0);
      expect(config?.contextBudgetTokens).toBeGreaterThanOrEqual(4000);
      expect(config?.iterationLimit).toBeGreaterThan(0);
      expect(config?.outputContract).toBeTruthy();
    }
  });

  it('should enforce read-only non-destructive boundaries on Explorer and Architect subagents', () => {
    const explorer = manager.getSubagentConfig('explorer');
    const mutatingTools = ['write_file', 'edit_file', 'delete_file', 'run_shell'];
    for (const tool of mutatingTools) {
      expect(explorer?.allowedTools).not.toContain(tool);
    }

    const architect = manager.getSubagentConfig('architect');
    for (const tool of mutatingTools) {
      expect(architect?.allowedTools).not.toContain(tool);
    }
  });

  it('should reject execution of unknown subagent roles', async () => {
    await expect(
      manager.runSubagentTask('non_existent_role', 'Do something', 'test-session')
    ).rejects.toThrow(/Unknown subagent role/);
  });
});
