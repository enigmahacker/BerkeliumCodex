export interface ThemeColors {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    tool: string;
    assistant: string;
    user: string;
    border: string;
    muted: string;
    accent: string;
    dim: string;
    highlight: string;
}
export interface ThemeUI {
    border: 'rounded' | 'single' | 'double' | 'bold' | 'minimal' | 'ascii';
    density: 'compact' | 'normal' | 'relaxed';
    animations: boolean;
    unicode: boolean;
}
export interface Theme {
    name: string;
    description?: string;
    colors: ThemeColors;
    ui: ThemeUI;
}
export type ThemeName = 'berkelium-dark' | 'berkelium-light' | 'matrix' | 'dracula' | 'nord' | 'terminal' | 'minimal' | 'high-contrast' | string;
//# sourceMappingURL=types.d.ts.map