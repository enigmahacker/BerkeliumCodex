import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { ThemeManager } from '@berkelium/themes';
import { ConfigManager } from '@berkelium/config';
import { AuthStore } from '@berkelium/auth';
import { ProviderRouter } from '@berkelium/providers';
import { Logger } from '@berkelium/logging';
import { ListCommand } from '../../apps/cli/src/commands/list.js';
import { ShowCommand } from '../../apps/cli/src/commands/show.js';
import { RmCommand } from '../../apps/cli/src/commands/rm.js';
import { PsCommand } from '../../apps/cli/src/commands/ps.js';
import { RuntimeCommand } from '../../apps/cli/src/commands/runtime.js';
import { CloudCommand } from '../../apps/cli/src/commands/cloud.js';
import { ModeCommand } from '../../apps/cli/src/commands/mode.js';
import { PrivacyCommand } from '../../apps/cli/src/commands/privacy.js';
import { ModelSubcommand } from '../../apps/cli/src/commands/model-cmd.js';
import { StatusCommand } from '../../apps/cli/src/commands/status.js';

describe('CLI Commands Suite', () => {
  let tmpDir: string;
  let themeManager: ThemeManager;
  let configManager: ConfigManager;
  let authStore: AuthStore;
  let router: ProviderRouter;
  let consoleSpy: any;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-cli-test-'));
    themeManager = new ThemeManager();
    configManager = new ConfigManager();
    authStore = new AuthStore({ vaultPath: path.join(tmpDir, 'vault.json') });
    router = new ProviderRouter(configManager.getConfig(), new Logger({ subsystem: 'test' }));
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Best-effort
    }
  });

  it('ListCommand should execute without crashing', async () => {
    await ListCommand.run(themeManager, tmpDir);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('ShowCommand should handle missing model gracefully', async () => {
    await ShowCommand.run(themeManager, 'missing-model', tmpDir);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('RmCommand should handle missing model gracefully', async () => {
    await RmCommand.run(themeManager, 'missing-model', tmpDir);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('PsCommand should report running processes', async () => {
    await PsCommand.run(themeManager);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('RuntimeCommand should list local runtime engines', async () => {
    await RuntimeCommand.run(themeManager, 'list');
    expect(consoleSpy).toHaveBeenCalled();

    await RuntimeCommand.run(themeManager, 'status');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('CloudCommand should display cloud providers and usage', async () => {
    await CloudCommand.run(themeManager, configManager, authStore, router, 'providers');
    expect(consoleSpy).toHaveBeenCalled();

    await CloudCommand.run(themeManager, configManager, authStore, router, 'usage');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('ModeCommand should display and switch modes', async () => {
    await ModeCommand.run(themeManager, configManager);
    expect(consoleSpy).toHaveBeenCalled();

    await ModeCommand.run(themeManager, configManager, 'local');
    expect(configManager.getConfig().mode).toBe('local');

    await ModeCommand.run(themeManager, configManager, 'hybrid');
    expect(configManager.getConfig().mode).toBe('hybrid');
  });

  it('PrivacyCommand should display and switch privacy policies', async () => {
    await PrivacyCommand.run(themeManager, configManager);
    expect(consoleSpy).toHaveBeenCalled();

    await PrivacyCommand.run(themeManager, configManager, 'local');
    expect(configManager.getConfig().privacy.mode).toBe('local');

    await PrivacyCommand.run(themeManager, configManager, 'cloud');
    expect(configManager.getConfig().privacy.mode).toBe('cloud');
  });

  it('ModelSubcommand should handle subactions', async () => {
    await ModelSubcommand.run(themeManager, configManager, router, 'current');
    expect(consoleSpy).toHaveBeenCalled();

    await ModelSubcommand.run(themeManager, configManager, router, 'list', undefined, tmpDir);
    expect(consoleSpy).toHaveBeenCalled();

    await ModelSubcommand.run(themeManager, configManager, router, 'cache', undefined, tmpDir);
    expect(consoleSpy).toHaveBeenCalled();

    await ModelSubcommand.run(themeManager, configManager, router, 'prune', '30', tmpDir);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('StatusCommand should print full system overview', async () => {
    await StatusCommand.run(themeManager, configManager, router, false);
    expect(consoleSpy).toHaveBeenCalled();

    await StatusCommand.run(themeManager, configManager, router, true);
    expect(consoleSpy).toHaveBeenCalled();
  });
});
