import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { parse as parseYaml } from 'yaml';
import { Theme, ThemeName } from './types.js';
import { builtinThemes } from './builtin.js';
import { fgHex, bgHex, bold, dim, italic, underline } from './ansi.js';

export interface FormattedTheme {
  theme: Theme;
  primary: (text: string) => string;
  secondary: (text: string) => string;
  success: (text: string) => string;
  warning: (text: string) => string;
  error: (text: string) => string;
  tool: (text: string) => string;
  assistant: (text: string) => string;
  user: (text: string) => string;
  border: (text: string) => string;
  muted: (text: string) => string;
  accent: (text: string) => string;
  dimmed: (text: string) => string;
  highlight: (text: string) => string;
  bg: (text: string) => string;
  bold: (text: string) => string;
  italic: (text: string) => string;
  underline: (text: string) => string;
}

export class ThemeManager {
  private activeTheme: Theme;
  private customThemes: Map<string, Theme> = new Map();
  private listeners: Set<(theme: Theme) => void> = new Set();

  constructor(defaultThemeName: ThemeName = 'berkelium-dark') {
    this.activeTheme = builtinThemes[defaultThemeName] || builtinThemes['berkelium-dark'];
    this.loadUserThemes();
  }

  public getActiveTheme(): Theme {
    return this.activeTheme;
  }

  public getFormatted(): FormattedTheme {
    const c = this.activeTheme.colors;
    return {
      theme: this.activeTheme,
      primary: (t: string) => fgHex(c.primary, t),
      secondary: (t: string) => fgHex(c.secondary, t),
      success: (t: string) => fgHex(c.success, t),
      warning: (t: string) => fgHex(c.warning, t),
      error: (t: string) => fgHex(c.error, t),
      tool: (t: string) => fgHex(c.tool, t),
      assistant: (t: string) => fgHex(c.assistant, t),
      user: (t: string) => fgHex(c.user, t),
      border: (t: string) => fgHex(c.border, t),
      muted: (t: string) => fgHex(c.muted, t),
      accent: (t: string) => fgHex(c.accent, t),
      dimmed: (t: string) => fgHex(c.dim, t),
      highlight: (t: string) => fgHex(c.highlight, t),
      bg: (t: string) => bgHex(c.background, t),
      bold: (t: string) => bold(t),
      italic: (t: string) => italic(t),
      underline: (t: string) => underline(t),
    };
  }

  public setTheme(name: string): boolean {
    const theme = builtinThemes[name] || this.customThemes.get(name);
    if (!theme) return false;
    this.activeTheme = theme;
    for (const listener of this.listeners) {
      try {
        listener(theme);
      } catch (err) {
        console.error('[ThemeManager] Listener error:', err);
      }
    }
    return true;
  }

  public onThemeChange(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public listThemes(): Array<{ name: string; description?: string; isBuiltin: boolean }> {
    const list: Array<{ name: string; description?: string; isBuiltin: boolean }> = [];
    for (const [name, t] of Object.entries(builtinThemes)) {
      list.push({ name, description: t.description, isBuiltin: true });
    }
    for (const [name, t] of this.customThemes.entries()) {
      list.push({ name, description: t.description || 'User theme', isBuiltin: false });
    }
    return list;
  }

  public loadUserThemes(): void {
    const themesDir = path.join(os.homedir(), '.berkelium', 'themes');
    if (!fs.existsSync(themesDir)) return;

    try {
      const files = fs.readdirSync(themesDir);
      for (const file of files) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const filePath = path.join(themesDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const parsed = parseYaml(content) as Theme;
          if (parsed && parsed.name && parsed.colors) {
            this.customThemes.set(parsed.name, parsed);
          }
        }
      }
    } catch {
      // Ignore user theme read errors gracefully
    }
  }
}

export const defaultThemeManager = new ThemeManager();
