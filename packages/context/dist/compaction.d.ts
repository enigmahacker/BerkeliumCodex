import { Message } from '@berkelium/providers';
export interface CompactionResult {
    compacted: boolean;
    messages: Message[];
    tokensBefore: number;
    tokensAfter: number;
    summary?: string;
}
export declare class ContextCompactor {
    static compact(messages: Message[], maxBudgetTokens: number, thresholdRatio?: number): CompactionResult;
}
//# sourceMappingURL=compaction.d.ts.map