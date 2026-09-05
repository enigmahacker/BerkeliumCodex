import { Theme, ThemeName } from './types.js';
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
export declare class ThemeManager {
    private activeTheme;
    private customThemes;
    private listeners;
    constructor(defaultThemeName?: ThemeName);
    getActiveTheme(): Theme;
    getFormatted(): FormattedTheme;
    setTheme(name: string): boolean;
    onThemeChange(listener: (theme: Theme) => void): () => void;
    listThemes(): Array<{
        name: string;
        description?: string;
        isBuiltin: boolean;
    }>;
    loadUserThemes(): void;
}
export declare const defaultThemeManager: ThemeManager;
//# sourceMappingURL=theme-manager.d.ts.map