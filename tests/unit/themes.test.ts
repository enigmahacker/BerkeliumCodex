import { describe, it, expect } from 'vitest';
import { ThemeManager, builtinThemes, hexToRgb, fgHex } from '@berkelium/themes';

describe('Theming Engine', () => {
  it('should have all 8 required core themes', () => {
    const requiredThemes = [
      'berkelium-dark',
      'berkelium-light',
      'matrix',
      'dracula',
      'nord',
      'terminal',
      'minimal',
      'high-contrast',
    ];

    for (const name of requiredThemes) {
      expect(builtinThemes[name]).toBeDefined();
      expect(builtinThemes[name].colors.primary).toBeDefined();
      expect(builtinThemes[name].colors.background).toBeDefined();
      expect(builtinThemes[name].ui.border).toBeDefined();
    }
  });

  it('should switch theme dynamically without restart', () => {
    const manager = new ThemeManager('berkelium-dark');
    expect(manager.getActiveTheme().name).toBe('berkelium-dark');

    const changed = manager.setTheme('matrix');
    expect(changed).toBe(true);
    expect(manager.getActiveTheme().name).toBe('matrix');
    expect(manager.getActiveTheme().colors.foreground).toBe('#00ff66');
  });

  it('should convert hex colors to ANSI codes', () => {
    const rgb = hexToRgb('#00d2ff');
    expect(rgb).toEqual([0, 210, 255]);
  });
});
