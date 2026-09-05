import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { parse as parseYaml } from 'yaml';
import { builtinThemes } from './builtin.js';
import { fgHex, bgHex, bold, italic, underline } from './ansi.js';
export class ThemeManager {
    activeTheme;
    customThemes = new Map();
    listeners = new Set();
    constructor(defaultThemeName = 'berkelium-dark') {
        this.activeTheme = builtinThemes[defaultThemeName] || builtinThemes['berkelium-dark'];
        this.loadUserThemes();
    }
    getActiveTheme() {
        return this.activeTheme;
    }
    getFormatted() {
        const c = this.activeTheme.colors;
        return {
            theme: this.activeTheme,
            primary: (t) => fgHex(c.primary, t),
            secondary: (t) => fgHex(c.secondary, t),
            success: (t) => fgHex(c.success, t),
            warning: (t) => fgHex(c.warning, t),
            error: (t) => fgHex(c.error, t),
            tool: (t) => fgHex(c.tool, t),
            assistant: (t) => fgHex(c.assistant, t),
            user: (t) => fgHex(c.user, t),
            border: (t) => fgHex(c.border, t),
            muted: (t) => fgHex(c.muted, t),
            accent: (t) => fgHex(c.accent, t),
            dimmed: (t) => fgHex(c.dim, t),
            highlight: (t) => fgHex(c.highlight, t),
            bg: (t) => bgHex(c.background, t),
            bold: (t) => bold(t),
            italic: (t) => italic(t),
            underline: (t) => underline(t),
        };
    }
    setTheme(name) {
        const theme = builtinThemes[name] || this.customThemes.get(name);
        if (!theme)
            return false;
        this.activeTheme = theme;
        for (const listener of this.listeners) {
            try {
                listener(theme);
            }
            catch (err) {
                console.error('[ThemeManager] Listener error:', err);
            }
        }
        return true;
    }
    onThemeChange(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    listThemes() {
        const list = [];
        for (const [name, t] of Object.entries(builtinThemes)) {
            list.push({ name, description: t.description, isBuiltin: true });
        }
        for (const [name, t] of this.customThemes.entries()) {
            list.push({ name, description: t.description || 'User theme', isBuiltin: false });
        }
        return list;
    }
    loadUserThemes() {
        const themesDir = path.join(os.homedir(), '.berkelium', 'themes');
        if (!fs.existsSync(themesDir))
            return;
        try {
            const files = fs.readdirSync(themesDir);
            for (const file of files) {
                if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                    const filePath = path.join(themesDir, file);
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const parsed = parseYaml(content);
                    if (parsed && parsed.name && parsed.colors) {
                        this.customThemes.set(parsed.name, parsed);
                    }
                }
            }
        }
        catch {
            // Ignore user theme read errors gracefully
        }
    }
}
export const defaultThemeManager = new ThemeManager();
//# sourceMappingURL=theme-manager.js.map