import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Message } from '@berkelium/providers';
import { Logger } from '@berkelium/logging';
import { RepoMapper } from './repo-map.js';
import { FileRanker } from './ranking.js';
import { Tokenizer } from './tokenizer.js';
import { ContextCompactor, CompactionResult } from './compaction.js';
import { ContextBreakdown, FileMetadata, RankedFile } from './types.js';

export class ContextEngine {
  private workspaceRoot: string;
  private repoMapper: RepoMapper;
  private logger: Logger;
  private activeFiles: Set<string> = new Set();
  private maxContextLimit: number;

  constructor(workspaceRoot = process.cwd(), logger: Logger, maxContextLimit = 128000) {
    this.workspaceRoot = path.resolve(workspaceRoot);
    this.logger = logger.child('context');
    this.repoMapper = new RepoMapper(this.workspaceRoot);
    this.maxContextLimit = maxContextLimit;
  }

  public setMaxContextLimit(limit: number): void {
    this.maxContextLimit = limit;
  }

  public markFileActive(filePath: string): void {
    this.activeFiles.add(path.relative(this.workspaceRoot, path.resolve(this.workspaceRoot, filePath)));
  }

  public async getRepoMap(maxTokens = 2000): Promise<string> {
    return this.repoMapper.generateRepoMap(maxTokens);
  }

  public async rankFilesForQuery(query: string): Promise<RankedFile[]> {
    const files = await this.repoMapper.scan();
    return FileRanker.rankFiles(query, files, this.activeFiles);
  }

  public compactIfNeeded(messages: Message[], threshold = 0.75): CompactionResult {
    return ContextCompactor.compact(messages, this.maxContextLimit, threshold);
  }

  public async getBreakdown(
    systemPrompt: string,
    messages: Message[],
    toolDefinitionsText = ''
  ): Promise<ContextBreakdown> {
    const systemTokens = Tokenizer.countTokens(systemPrompt);
    const repoMap = await this.getRepoMap(2000);
    const projectTokens = Tokenizer.countTokens(repoMap);
    const conversationTokens = messages.reduce(
      (sum, m) => sum + Tokenizer.countTokens(m.content || '') + 10,
      0
    );
    const toolsTokens = Tokenizer.countTokens(toolDefinitionsText);

    let filesTokens = 0;
    for (const activePath of this.activeFiles) {
      try {
        const fullPath = path.resolve(this.workspaceRoot, activePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        filesTokens += Tokenizer.countTokens(content);
      } catch {}
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
