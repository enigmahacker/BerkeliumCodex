import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';

export const SearchTextInputSchema = z.object({
  query: z.string().describe('Exact text query or regex pattern to search for across files'),
  path: z.string().default('.').describe('Directory path to search in'),
  is_regex: z.boolean().default(false).describe('Whether query is a regex pattern'),
  max_results: z.number().default(50).describe('Maximum matching lines to return'),
});

export type SearchTextInput = z.infer<typeof SearchTextInputSchema>;

export interface SearchMatch {
  file: string;
  lineNumber: number;
  lineContent: string;
}

export class SearchTextTool implements Tool<SearchTextInput> {
  public readonly metadata = {
    name: 'search_text',
    description: 'Search for text matches or patterns inside workspace files',
    category: 'filesystem' as const,
    risk: 'low' as const,
    filesystem: { read: true },
  };

  public readonly schema = SearchTextInputSchema;

  public async execute(args: SearchTextInput, context: ToolContext): Promise<ToolExecutionResult> {
    try {
      const startDir = path.resolve(context.workspaceRoot, args.path || '.');
      const matches: SearchMatch[] = [];
      const regex = args.is_regex ? new RegExp(args.query, 'g') : null;
      const maxResults = args.max_results || 50;

      await this.searchDir(startDir, context.workspaceRoot, args.query, regex, matches, maxResults);

      const formatted = matches
        .map((m) => `${m.file}:${m.lineNumber}: ${m.lineContent.trim()}`)
        .join('\n');

      return {
        success: true,
        output: matches.length > 0 ? formatted : `No matches found for query "${args.query}".`,
        data: {
          query: args.query,
          totalMatches: matches.length,
          matches,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        output: `Error searching text: ${err.message}`,
        error: err.message,
      };
    }
  }

  private async searchDir(
    dir: string,
    root: string,
    query: string,
    regex: RegExp | null,
    matches: SearchMatch[],
    maxResults: number
  ): Promise<void> {
    if (matches.length >= maxResults) return;

    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const e of entries) {
      if (matches.length >= maxResults) return;
      if (e.name === '.git' || e.name === 'node_modules' || e.name === 'dist' || e.name === 'build') continue;

      const fullPath = path.join(dir, e.name);
      const relPath = path.relative(root, fullPath);

      if (e.isDirectory()) {
        await this.searchDir(fullPath, root, query, regex, matches, maxResults);
      } else {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            if (matches.length >= maxResults) break;
            const line = lines[i];

            if (regex ? regex.test(line) : line.includes(query)) {
              matches.push({
                file: relPath,
                lineNumber: i + 1,
                lineContent: line,
              });
            }
          }
        } catch {
          // Skip binary or unreadable files
        }
      }
    }
  }
}
