import { describe, it, expect } from 'vitest';
import { CommandRegistry } from '../../apps/cli/src/commands/registry.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('CommandRegistry', () => {
  it('should initialize all built-in commands with categories and arguments', () => {
    const registry = CommandRegistry.getInstance();
    const all = registry.list();

    expect(all.length).toBeGreaterThanOrEqual(20);

    const helpCmd = registry.get('help');
    expect(helpCmd).toBeDefined();
    expect(helpCmd?.category).toBe('GENERAL');

    const modelCmd = registry.get('model');
    expect(modelCmd).toBeDefined();
    expect(modelCmd?.category).toBe('MODEL');
    expect(modelCmd?.arguments?.[0]?.dynamicProvider).toBe('model');

    const themeCmd = registry.get('theme');
    expect(themeCmd).toBeDefined();
    expect(themeCmd?.category).toBe('THEMES');
    expect(themeCmd?.arguments?.[0]?.dynamicProvider).toBe('theme');
  });

  it('should resolve aliases accurately', () => {
    const registry = CommandRegistry.getInstance();

    expect(registry.get('m')?.name).toBe('model');
    expect(registry.get('p')?.name).toBe('provider');
    expect(registry.get('t')?.name).toBe('tools');
    expect(registry.get('cfg')?.name).toBe('config');
    expect(registry.get('q')?.name).toBe('quit');
    expect(registry.get('v')?.name).toBe('version');
  });

  it('should register and unregister dynamic plugin commands', () => {
    const registry = CommandRegistry.getInstance();

    registry.registerPluginCommand('github-plugin', {
      name: 'pr',
      aliases: ['pull-request'],
      description: 'Create or inspect GitHub pull requests',
      category: 'CUSTOM',
      usage: '/pr [action]',
      examples: ['/pr list'],
    });

    const prCmd = registry.get('pr');
    expect(prCmd).toBeDefined();
    expect(prCmd?.description).toContain('[github-plugin]');
    expect(registry.get('pull-request')?.name).toBe('pr');

    // Clean up
    registry.unregister('pr');
    expect(registry.get('pr')).toBeUndefined();
  });

  it('should discover custom commands from .berkelium/commands directory', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-custom-cmd-test-'));
    const customDir = path.join(tmpDir, '.berkelium', 'commands');
    fs.mkdirSync(customDir, { recursive: true });

    fs.writeFileSync(
      path.join(customDir, 'deploy.md'),
      '# Deploy Application\nExecute staging deployment workflow.'
    );

    const registry = new CommandRegistry();
    registry.loadCustomCommands(tmpDir);

    const deployCmd = registry.get('deploy');
    expect(deployCmd).toBeDefined();
    expect(deployCmd?.isCustom).toBe(true);
    expect(deployCmd?.description).toBe('Deploy Application');
    expect(deployCmd?.category).toBe('CUSTOM');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
