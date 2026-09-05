import { Message } from '@berkelium/providers';
export interface CompactionResult {
    compacted: boolean;
    messages: Message[];
    tokensBefore: number;
    tokensAfter: number;
    tokensSaved: number;
    summary?: string;
    microCompactedCount?: number;
}
export interface MicroCompactionOptions {
    keepRecentTurns?: number;
    maxOutputChars?: number;
}
export declare class MicroOutputCompactor {
    private static ANSI_REGEX;
    private static PROGRESS_REGEX;
    /**
     * Compacts large tool outputs from historical turns (> keepRecentTurns ago),
     * while keeping recent turns in 100% full fidelity.
     */
    static compactToolOutputs(messages: Message[], options?: MicroCompactionOptions): {
        messages: Message[];
        tokensSaved: number;
        compactedCount: number;
    };
    private static compactFileRead;
    private static compactSearchOutput;
    private static compactCommandOutput;
    private static compactDiffOutput;
    private static compactListDirOutput;
    private static compactGenericOutput;
}
export declare class ContextCompactor {
    static compact(messages: Message[], maxBudgetTokens: number, thresholdRatio?: number): CompactionResult;
}
//# sourceMappingURL=compaction.d.ts.map