import * as path from 'node:path';
import { Message } from '@berkelium/providers';
import { Logger } from '@berkelium/logging';
import { RepoMapper } from './repo-map.js';
import { FileRanker } from './ranking.js';
import { Tokenizer } from './tokenizer.js';
import { ContextCompactor, CompactionResult } from './compaction.js';
import { ContextBreakdown, FileMetadata, RankedFile } from './types.js';

/** Single source of truth for the repo-map slice injected into the system prompt. */
export const REPO_MAP_TOKEN_BUDGET = 800;

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

  public setWorkspaceRoot(newRoot: string): void {
    this.workspaceRoot = path.resolve(newRoot);
    this.repoMapper = new RepoMapper(this.workspaceRoot);
    this.activeFiles.clear();
  }

  public setMaxContextLimit(limit: number): void {
    this.maxContextLimit = limit;
  }

  public markFileActive(filePath: string): void {
    this.activeFiles.add(path.relative(this.workspaceRoot, path.resolve(this.workspaceRoot, filePath)));
  }

  public async getRepoMap(maxTokens = REPO_MAP_TOKEN_BUDGET): Promise<string> {
    return this.repoMapper.generateRepoMap(maxTokens);
  }

  public async rankFilesForQuery(query: string): Promise<RankedFile[]> {
    const files = await this.repoMapper.scan();
    return FileRanker.rankFiles(query, files, this.activeFiles);
  }

  /**
   * Formats the highest-ranked workspace files for the current request so the
   * model sees likely-relevant paths without injecting whole file contents.
   */
  public async getRelevantFilesContext(query: string, maxTokens = 160, maxFiles = 8): Promise<string> {
    try {
      const ranked = await this.rankFilesForQuery(query);
      if (ranked.length === 0) {
        return '';
      }

      const lines = ['Relevant files (ranked for current task):'];
      let listed = 0;
      let omitted = 0;

      for (const file of ranked) {
        if (listed >= maxFiles) {
          omitted = ranked.length - listed;
          break;
        }

        const symbols = file.topSymbols.length > 0 ? ` (${file.topSymbols.join(', ')})` : '';
        const line = `- ${file.path}${symbols}`;

        if (listed > 0 && Tokenizer.countTokens(lines.join('\n') + '\n' + line) > maxTokens - 10) {
          omitted = ranked.length - listed;
          break;
        }

        lines.push(line);
        listed++;
      }

      if (omitted > 0) {
        lines.push(`- ... ${omitted} more matching file(s)`);
      }

      return lines.join('\n');
    } catch (err) {
      this.logger.debug(`Relevant-file discovery failed: ${(err as Error).message}`);
      return '';
    }
  }

  public needsCompaction(messages: Message[], threshold = 0.75, overheadTokens = 0): boolean {
    const totalTokens = messages.reduce(
      (sum, m) => sum + Tokenizer.countMessageTokens(m),
      0
    );
    return totalTokens + Math.max(0, overheadTokens) > this.maxContextLimit * threshold;
  }

  public compactIfNeeded(messages: Message[], threshold = 0.75): CompactionResult {
    return ContextCompactor.compact(messages, this.maxContextLimit, threshold);
  }

  public async getBreakdown(
    systemPrompt: string,
    messages: Message[],
    toolDefinitionsText = '',
    repoMapTokens = REPO_MAP_TOKEN_BUDGET
  ): Promise<ContextBreakdown> {
    const systemTokens = Tokenizer.countTokens(systemPrompt);
    const repoMap = await this.getRepoMap(repoMapTokens);
    const projectTokens = Tokenizer.countTokens(repoMap);
    const conversationTokens = messages.reduce(
      (sum, m) => sum + Tokenizer.countMessageTokens(m),
      0
    );
    const toolsTokens = Tokenizer.countTokens(toolDefinitionsText);

    const totalTokens = systemTokens + projectTokens + conversationTokens + toolsTokens;
    const remaining = Math.max(0, this.maxContextLimit - totalTokens);

    return {
      systemTokens,
      projectTokens,
      conversationTokens,
      toolsTokens,
      totalTokens,
      limit: this.maxContextLimit,
      remaining,
    };
  }
}
