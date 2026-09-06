import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { ThemeManager } from '@berkelium/themes';
import { ConfigManager } from '@berkelium/config';
import { SessionManager } from '@berkelium/agent';
import { GitCommand } from '../../apps/cli/src/commands/git-cmd.js';
import { SessionCommand } from '../../apps/cli/src/commands/session-cmd.js';
import { MapCommand } from '../../apps/cli/src/commands/map-cmd.js';
import { SearchCommand } from '../../apps/cli/src/commands/search-cmd.js';
import { InspectCommand } from '../../apps/cli/src/commands/inspect-cmd.js';
import { AccessibilityCommand } from '../../apps/cli/src/commands/accessibility-cmd.js';
import { ConfigCommand } from '../../apps/cli/src/commands/config-cmd.js';

describe('Extended CLI Commands Suite', () => {
  let tmpDir: string;
  let themeManager: ThemeManager;
  let configManager: ConfigManager;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-cmds-test-'));
    themeManager = new ThemeManager('berkelium');
    configManager = new ConfigManager(tmpDir);
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  describe('GitCommand & Safety Guards', () => {
    it('should detect destructive commands accurately', () => {
      expect(GitCommand.isDestructive('reset --hard HEAD')).toBe(true);
      expect(GitCommand.isDestructive('clean -fd')).toBe(true);
      expect(GitCommand.isDestructive('push origin main --force')).toBe(true);
      expect(GitCommand.isDestructive('status')).toBe(false);
      expect(GitCommand.isDestructive('diff')).toBe(false);
      expect(GitCommand.isDestructive('log -n 5')).toBe(false);
    });

    it('should block destructive operations without --force', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await GitCommand.run(themeManager, 'reset', ['--hard', 'HEAD'], tmpDir);

      const logs = consoleSpy.mock.calls.map((c) => c[0] || '').join('\n');
      expect(logs).toContain('DESTRUCTIVE OPERATION DETECTED');
      expect(logs).toContain('pass --force explicitly');

      consoleSpy.mockRestore();
    });

    it('should run non-destructive status safely in repo', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await GitCommand.run(themeManager, 'status', [], process.cwd());

      const logs = consoleSpy.mock.calls.map((c) => c[0] || '').join('\n');
      expect(logs).toContain('GIT WORKING TREE STATUS');

      consoleSpy.mockRestore();
    });
  });

  describe('SessionCommand', () => {
    it('should list, create, resume, and delete persistent sessions', async () => {
      const sessionMgr = new SessionManager(path.join(tmpDir, 'sessions'));
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // 1. New session
      await SessionCommand.run(themeManager, configManager, 'new', undefined, sessionMgr);
      let logs = consoleSpy.mock.calls.map((c) => c[0] || '').join('\n');
      expect(logs).toContain('Created new session:');

      // 2. List sessions
      consoleSpy.mockClear();
      await SessionCommand.run(themeManager, configManager, 'list', undefined, sessionMgr);
      logs = consoleSpy.mock.calls.map((c) => c[0] || '').join('\n');
      expect(logs).toContain('PERSISTENT SESSIONS');

      // 3. Resume session
      const sessions = await sessionMgr.listSessions();
      expect(sessions.length).toBe(1);
      const targetId = sessions[0].id;

      consoleSpy.mockClear();
      await SessionCommand.run(themeManager, configManager, 'resume', targetId, sessionMgr);
      logs = consoleSpy.mock.calls.map((c) => c[0] || '').join('\n');
      expect(logs).toContain(`Resumed session: ${targetId}`);

      // 4. Delete session
      consoleSpy.mockClear();
      await SessionCommand.run(themeManager, configManager, 'delete', targetId, sessionMgr);
      logs = consoleSpy.mock.calls.map((c) => c[0] || '').join('\n');
      expect(logs).toContain(`Deleted session "${targetId}"`);

      consoleSpy.mockRestore();
    });
  });

  describe('MapCommand', () => {
    it('should generate repository symbol map without throwing', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await MapCommand.run(themeManager, process.cwd(), 500);

      const logs = consoleSpy.mock.calls.map((c) => c[0] || '').join('\n');
      expect(logs).toContain('REPOSITORY SYMBOL MAP');
      expect(logs).toContain('Token density:');

      consoleSpy.mockRestore();
    });
  });

  describe('SearchCommand', () => {
    it('should search codebase and report matches', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await SearchCommand.run(themeManager, 'ProviderRouter', process.cwd());

      const logs = consoleSpy.mock.calls.map((c) => c[0] || '').join('\n');
      expect(logs).toContain('SEARCH RESULTS FOR "ProviderRouter"');
      expect(logs).toContain('Found');

      consoleSpy.mockRestore();
    });
  });

  describe('InspectCommand', () => {
    it('should inspect target file tokens, lines, and symbols', async () => {
      const testFile = path.join(tmpDir, 'test-component.ts');
      fs.writeFileSync(
        testFile,
        'export class Calculator {\n  public add(a: number, b: number): number {\n    return a + b;\n  }\n}\n'
      );

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await InspectCommand.run(themeManager, testFile, tmpDir);

      const logs = consoleSpy.mock.calls.map((c) => c[0] || '').join('\n');
      expect(logs).toContain('FILE INSPECTION: test-component.ts');
      expect(logs).toContain('Tokens:');
      expect(logs).toContain('Lines:');

      consoleSpy.mockRestore();
    });
  });

  describe('AccessibilityCommand', () => {
    it('should enable and disable accessibility mode cleanly', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Enable
      await AccessibilityCommand.run(themeManager, configManager, 'enable');
      let logs = consoleSpy.mock.calls.map((c) => c[0] || '').join('\n');
      expect(logs).toContain('Accessibility mode enabled');
      expect(themeManager.getActiveTheme().name).toBe('high-contrast');

      // Status
      consoleSpy.mockClear();
      await AccessibilityCommand.run(themeManager, configManager, 'status');
      logs = consoleSpy.mock.calls.map((c) => c[0] || '').join('\n');
      expect(logs).toContain('ACCESSIBILITY CONFIGURATION');

      // Disable
      consoleSpy.mockClear();
      await AccessibilityCommand.run(themeManager, configManager, 'disable');
      logs = consoleSpy.mock.calls.map((c) => c[0] || '').join('\n');
      expect(logs).toContain('Accessibility mode disabled');

      consoleSpy.mockRestore();
    });
  });

  describe('ConfigCommand', () => {
    it('should list, get, and set configuration values', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // 1. List
      await ConfigCommand.run(themeManager, configManager, 'list');
      let logs = consoleSpy.mock.calls.map((c) => c[0] || '').join('\n');
      expect(logs).toContain('ACTIVE BERKELIUM CONFIGURATION');

      // 2. Path
      consoleSpy.mockClear();
      await ConfigCommand.run(themeManager, configManager, 'path');
      logs = consoleSpy.mock.calls.map((c) => c[0] || '').join('\n');
      expect(logs).toContain('CONFIGURATION PATHS');

      // 3. Set & Get
      consoleSpy.mockClear();
      await ConfigCommand.run(themeManager, configManager, 'set', 'default_model', 'qwen3-coder:30b');
      logs = consoleSpy.mock.calls.map((c) => c[0] || '').join('\n');
      expect(logs).toContain('Set "default_model" to "qwen3-coder:30b"');

      consoleSpy.mockClear();
      await ConfigCommand.run(themeManager, configManager, 'get', 'default_model');
      logs = consoleSpy.mock.calls.map((c) => c[0] || '').join('\n');
      expect(logs).toContain('default_model:');

      consoleSpy.mockRestore();
    });
  });
});
