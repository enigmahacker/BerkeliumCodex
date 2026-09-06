import { describe, it, expect, vi } from 'vitest';
import * as os from 'node:os';
import * as path from 'node:path';
import { ThemeManager } from '@berkelium/themes';
import { ConfigManager } from '@berkelium/config';
import { ProviderRouter } from '@berkelium/providers';
import { Logger } from '@berkelium/logging';
import { ModelPicker } from '../../apps/cli/src/tui/model-picker.js';

describe('ModelPicker TUI Component', () => {
  const tmpDir = path.join(os.tmpdir(), `bk-picker-test-${Date.now()}`);
  const themeManager = new ThemeManager('berkelium');
  const configManager = new ConfigManager(tmpDir);
  const logger = new Logger({ subsystem: 'test' });
  const router = new ProviderRouter(configManager.getConfig(), logger);

  it('should initialize and group items into LOCAL and CLOUD', () => {
    const picker = new ModelPicker(themeManager, configManager, router, tmpDir);
    const items = picker.getItems();

    expect(items.length).toBeGreaterThanOrEqual(5);

    const localItems = items.filter((i) => i.category === 'LOCAL');
    const cloudItems = items.filter((i) => i.category === 'CLOUD');

    expect(localItems.length).toBeGreaterThanOrEqual(2);
    expect(cloudItems.length).toBeGreaterThanOrEqual(3);

    // Verify local model details
    expect(localItems.some((m) => m.id === 'qwen3-coder:30b')).toBe(true);
    expect(localItems.some((m) => m.details?.includes('MLX'))).toBe(true);

    // Verify cloud model details
    expect(cloudItems.some((m) => m.name.includes('Gemini'))).toBe(true);
    expect(cloudItems.some((m) => m.target.startsWith('cloud/'))).toBe(true);
  });

  it('should render static selection list cleanly in non-TTY mode', async () => {
    const picker = new ModelPicker(themeManager, configManager, router, tmpDir);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    picker.renderStatic();

    expect(consoleSpy).toHaveBeenCalled();
    const calls = consoleSpy.mock.calls.map((c) => c[0] || '').join('\n');
    expect(calls).toContain('SELECT MODEL');
    expect(calls).toContain('LOCAL');
    expect(calls).toContain('CLOUD');

    consoleSpy.mockRestore();
  });

  it('should return null non-interactively when process.stdin.isTTY is false', async () => {
    const picker = new ModelPicker(themeManager, configManager, router, tmpDir);
    const prevTTY = process.stdin.isTTY;
    process.stdin.isTTY = false;

    const res = await picker.promptInteractive();
    expect(res).toBeNull();

    process.stdin.isTTY = prevTTY;
  });
});
