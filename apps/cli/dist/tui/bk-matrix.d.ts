import { ThemeManager } from '@berkelium/themes';
export interface MatrixRainOptions {
    durationMs?: number;
    columns?: number;
    rows?: number;
    fps?: number;
    colorScheme?: 'cyan' | 'matrix-green' | 'cobalt';
}
export declare class BkMatrix {
    private static readonly GLYPHS;
    /**
     * Renders the authentic Berkelium (Bk - 97 / 247) Codex Emblem
     * with electric cyan & cobalt gradient styling.
     *
     * Inspired by:
     *  - Element 97 (Berkelium)
     *  - Atomic Weight (247)
     *  - "PROUDLY INDIAN. BUILT FOR THE WORLD."
     */
    static renderCodexEmblem(themeManager?: ThemeManager): void;
    /**
     * Compact header banner for the interactive TUI.
     */
    static renderCodexHeader(themeManager: ThemeManager, model: string, provider: string, workspace: string): void;
    /**
     * Plays a high-fidelity Matrix / Codex digital stream sequence with
     * independent falling character streams, bright leading heads, glowing trails,
     * and a seamless dissolution into the Bk Codex Emblem.
     */
    static playMatrixRain(themeManager: ThemeManager, options?: MatrixRainOptions): Promise<void>;
    private static randomGlyph;
}
//# sourceMappingURL=bk-matrix.d.ts.map