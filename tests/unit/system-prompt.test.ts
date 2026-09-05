import { describe, it, expect, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { ThemeManager } from '@berkelium/themes';
import { ConfigManager, PromptEngine } from '@berkelium/config';
import { LaunchAnimation } from '../../apps/cli/src/tui/animation.js';
import { TUIOverlays } from '../../apps/cli/src/tui/overlays.js';

describe('System Prompt Engine & Launch Animation', () => {
  it('should render the new LaunchAnimation banner with system details', async () => {
    const themeManager = new ThemeManager('berkelium-dark');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const clearSpy = vi.spyOn(console, 'clear').mockImplementation(() => {});

    await LaunchAnimation.play(themeManager, {
      durationMs: 50,
      model: 'deepseek/deepseek-chat',
      provider: 'OpenRouter',
      workspace: '/Users/test/workspace',
      toolCount: 20,
    });

    expect(logSpy).toHaveBeenCalled();
    const calls = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(calls).toContain('B E R K E L I U M');
    expect(calls).toContain('initializing agent runtime...');
    expect(calls).toContain('loading provider registry...');
    expect(calls).toContain('indexing workspace...');
    expect(calls).toContain('MODEL:');
    expect(calls).toContain('SECURITY:');
    // Ensure raw API keys are never leaked into the launch screen
    expect(calls).not.toContain('sk-');
    expect(calls).not.toContain('nvapi-');

    logSpy.mockRestore();
    clearSpy.mockRestore();
  });

  it('should support saving, composing, and resetting custom prompt layers', () => {
    const tmpWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-prompt-test-'));

    try {
      // 1. Save custom coding prompt
      PromptEngine.saveCustomPrompt(
        tmpWorkspace,
        'coding',
        'Always use strict TypeScript types and write JSDoc comments.'
      );

      // 2. Load layers
      const layers = PromptEngine.loadCustomPrompts(tmpWorkspace);
      expect(layers.coding).toBe(
        'Always use strict TypeScript types and write JSDoc comments.'
      );

      // 3. Compose prompt
      const composed = PromptEngine.compose(layers, tmpWorkspace);
      expect(composed).toContain('Always use strict TypeScript types');
      expect(composed).toContain('You are Berkelium');

      // 4. Reset custom prompt
      const reset = PromptEngine.resetCustomPrompt(tmpWorkspace, 'coding');
      expect(reset).toBe(true);

      const layersAfterReset = PromptEngine.loadCustomPrompts(tmpWorkspace);
      expect(layersAfterReset.coding).toBeUndefined();
    } finally {
      fs.rmSync(tmpWorkspace, { recursive: true, force: true });
    }
  });

  it('should render system prompt overlay without errors', () => {
    const themeManager = new ThemeManager('berkelium-dark');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const layers = PromptEngine.loadCustomPrompts();
    TUIOverlays.renderSystemPrompt(themeManager, layers, '/mock/workspace');

    expect(logSpy).toHaveBeenCalled();
    const calls = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(calls).toContain('ACTIVE SYSTEM PROMPT & LAYERS');
    expect(calls).toContain('PROMPT LAYERS:');
    expect(calls).toContain('/system set');

    logSpy.mockRestore();
  });
});
