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
     * Render the command suggestions panel.
     */
    renderCommandSuggestions(matches: CommandMatchResult[], selectedIndex: number, scrollOffset: number, query: string): string[];
    /**
     * Render dynamic argument suggestions panel (e.g. models, providers, themes).
     */
    renderArgumentSuggestions(commandName: string, argName: string, matches: ArgumentMatchResult[], selectedIndex: number, scrollOffset: number, query: string): string[];
}
//# sourceMappingURL=command-palette.d.ts.map