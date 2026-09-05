import { ThemeManager } from '@berkelium/themes';
import { CommandMatchResult, ArgumentMatchResult } from '../commands/types.js';
export interface CommandPaletteOptions {
    themeManager: ThemeManager;
    maxVisibleItems?: number;
}
export declare class CommandPaletteRenderer {
    private themeManager;
    private maxVisibleItems;
    constructor(options: CommandPaletteOptions);
    /**
     * Helper to format a box row with exact padding and right border alignment.
     */
    private formatBoxRow;
    /**
     * Render the command suggestions pop-up panel.
     */
    renderCommandSuggestions(matches: CommandMatchResult[], selectedIndex: number, scrollOffset: number, query: string): string[];
    /**
     * Render dynamic argument suggestions pop-up panel (e.g. models, providers, themes).
     */
    renderArgumentSuggestions(commandName: string, argName: string, matches: ArgumentMatchResult[], selectedIndex: number, scrollOffset: number, query: string): string[];
}
//# sourceMappingURL=command-palette.d.ts.map