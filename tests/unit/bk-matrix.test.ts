import { describe, it, expect, vi } from 'vitest';
import { ThemeManager } from '@berkelium/themes';
import { BkMatrix } from '../../apps/cli/src/tui/bk-matrix.js';

describe('Bk Matrix & Codex Engine', () => {
  it('should render the official Berkelium Codex Emblem without error', () => {
    const themeManager = new ThemeManager('berkelium-dark');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    BkMatrix.renderCodexEmblem(themeManager);

    expect(logSpy).toHaveBeenCalled();
    const calls = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(calls).toContain('97');
    expect(calls).toContain('247');
    expect(calls).toContain('PROUDLY INDIAN. BUILT FOR THE WORLD.');

    logSpy.mockRestore();
  });

  it('should render the Codex Header correctly with model and workspace context', () => {
    const themeManager = new ThemeManager('matrix');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    BkMatrix.renderCodexHeader(
      themeManager,
      'coding',
      'ollama',
      '/workspace/berkelium'
    );

    expect(logSpy).toHaveBeenCalled();
    const calls = logSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(calls).toContain('Bk // BERKELIUM CODEX');
    expect(calls).toContain('coding (ollama)');
    expect(calls).toContain('Element 97');

    logSpy.mockRestore();
  });

  it('should execute matrix digital rain frames and terminate cleanly', async () => {
    const themeManager = new ThemeManager('berkelium-dark');
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const clearSpy = vi.spyOn(console, 'clear').mockImplementation(() => {});

    await BkMatrix.playMatrixRain(themeManager, {
      durationMs: 100,
      columns: 40,
      rows: 8,
      fps: 30,
    });

    expect(stdoutSpy).toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalled();

    stdoutSpy.mockRestore();
    clearSpy.mockRestore();
  });
});
