import { CommandExecutionContext, CommandDefinition, ArgumentMatchResult } from './types.js';
export interface CompletionOption {
    value: string;
    description?: string;
}
export declare class CompletionEngine {
    private static cachedModels;
    private static lastModelFetch;
    /**
     * Resolve dynamic argument completion options for a given command and argument index.
     */
    static getArgumentSuggestions(context: CommandExecutionContext, command: CommandDefinition, argIndex: number, query: string): Promise<ArgumentMatchResult[]>;
    private static getModelOptions;
}
//# sourceMappingURL=completion.d.ts.map