import { CommandDefinition, CommandMatchResult, ArgumentMatchResult } from './types.js';
export declare class CommandMatcher {
    /**
     * Match a query against a list of CommandDefinitions.
     * Ranking rules:
     * 1. Exact match (Score 1000)
     * 2. Prefix match (Score 800 - length delta)
     * 3. Word-prefix match (Score 600)
     * 4. Fuzzy subsequence match (Score 400 - distance penalty)
     */
    static matchCommands(commands: CommandDefinition[], query: string): CommandMatchResult[];
    /**
     * Match a query against dynamic argument options.
     */
    static matchArguments(options: Array<{
        value: string;
        description?: string;
    }>, query: string): ArgumentMatchResult[];
    private static scoreMatch;
}
//# sourceMappingURL=matcher.d.ts.map