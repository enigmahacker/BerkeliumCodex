import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { RepoMapper } from './repo-map.js';
import { FileRanker } from './ranking.js';
import { Tokenizer } from './tokenizer.js';
import { ContextCompactor } from './compaction.js';
export class ContextEngine {
    workspaceRoot;
    repoMapper;
    logger;
    activeFiles = new Set();
    maxContextLimit;
    constructor(workspaceRoot = process.cwd(), logger, maxContextLimit = 128000) {
        this.workspaceRoot = path.resolve(workspaceRoot);
        this.logger = logger.child('context');
        this.repoMapper = new RepoMapper(this.workspaceRoot);
        this.maxContextLimit = maxContextLimit;
    }
    setMaxContextLimit(limit) {
        this.maxContextLimit = limit;
    }
    markFileActive(filePath) {
        this.activeFiles.add(path.relative(this.workspaceRoot, path.resolve(this.workspaceRoot, filePath)));
    }
    async getRepoMap(maxTokens = 2000) {
        return this.repoMapper.generateRepoMap(maxTokens);
    }
    async rankFilesForQuery(query) {
        const files = await this.repoMapper.scan();
        return FileRanker.rankFiles(query, files, this.activeFiles);
    }
    compactIfNeeded(messages, threshold = 0.75) {
        return ContextCompactor.compact(messages, this.maxContextLimit, threshold);
    }
    async getBreakdown(systemPrompt, messages, toolDefinitionsText = '') {
        const systemTokens = Tokenizer.countTokens(systemPrompt);
        const repoMap = await this.getRepoMap(2000);
        const projectTokens = Tokenizer.countTokens(repoMap);
        const conversationTokens = messages.reduce((sum, m) => sum + Tokenizer.countTokens(m.content || '') + 10, 0);
        const toolsTokens = Tokenizer.countTokens(toolDefinitionsText);
        let filesTokens = 0;
        for (const activePath of this.activeFiles) {
            try {
                const fullPath = path.resolve(this.workspaceRoot, activePath);
                const content = await fs.readFile(fullPath, 'utf-8');
                filesTokens += Tokenizer.countTokens(content);
            }
            catch { }
        }
        const totalTokens = systemTokens + projectTokens + conversationTokens + toolsTokens + filesTokens;
        const remaining = Math.max(0, this.maxContextLimit - totalTokens);
        return {
            systemTokens,
            projectTokens,
            conversationTokens,
            toolsTokens,
            filesTokens,
            totalTokens,
            limit: this.maxContextLimit,
            remaining,
        };
    }
}
//# sourceMappingURL=engine.js.map