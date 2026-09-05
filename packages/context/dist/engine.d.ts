import { Message } from '@berkelium/providers';
import { Logger } from '@berkelium/logging';
import { CompactionResult } from './compaction.js';
import { ContextBreakdown, RankedFile } from './types.js';
export declare class ContextEngine {
    private workspaceRoot;
    private repoMapper;
    private logger;
    private activeFiles;
    private maxContextLimit;
    constructor(workspaceRoot: string | undefined, logger: Logger, maxContextLimit?: number);
    setMaxContextLimit(limit: number): void;
    markFileActive(filePath: string): void;
    getRepoMap(maxTokens?: number): Promise<string>;
    rankFilesForQuery(query: string): Promise<RankedFile[]>;
    compactIfNeeded(messages: Message[], threshold?: number): CompactionResult;
    getBreakdown(systemPrompt: string, messages: Message[], toolDefinitionsText?: string): Promise<ContextBreakdown>;
}
//# sourceMappingURL=engine.d.ts.map