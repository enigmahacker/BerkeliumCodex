import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';

export const SearchFilesInputSchema = z.object({
  pattern: z.string().describe('Filename or glob pattern to search for (e.g. *.ts, auth, session)'),
  path: z.string().default('.').describe('Directory path to start searching from'),
});

export type SearchFilesInput = z.infer<typeof SearchFilesInputSchema>;

export class SearchFilesTool implements Tool<SearchFilesInput> {
  public readonly metadata = {
    name: 'search_files',
    description: 'Find files matching a pattern or substring within the workspace',
    category: 'filesystem' as const,
    risk: 'low' as const,
    filesystem: { read: true },
  };

  public readonly schema = SearchFilesInputSchema;

  public async execute(args: SearchFilesInput, context: ToolContext): Promise<ToolExecutionResult> {
    try {
      const startDir = path.resolve(context.workspaceRoot, args.path || '.');
      const matches: string[] = [];
      const regex = new RegExp(args.pattern.replace(/\*/g, '.*'), 'i');

      await this.find(startDir, context.workspaceRoot, regex, matches);

      return {
        success: true,
        output: matches.length > 0 ? matches.join('\n') : `No files found matching pattern "${args.pattern}".`,
        data: {
          pattern: args.pattern,
          matches,
          total: matches.length,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        output: `Error searching files: ${err.message}`,
        error: err.message,
      };
    }
  }

  private async find(dir: string, root: string, regex: RegExp, matches: string[]): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const e of entries) {
      if (e.name === '.git' || e.name === 'node_modules' || e.name === 'dist' || e.name === 'build') continue;

      const fullPath = path.join(dir, e.name);
      const relPath = path.relative(root, fullPath);

      if (e.isDirectory()) {
        await this.find(fullPath, root, regex, matches);
      } else if (regex.test(e.name) || regex.test(relPath)) {
        matches.push(relPath);
      }
    }
  }
}
