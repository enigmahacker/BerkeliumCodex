import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
import { resolveSafeWorkspacePath } from './path-utils.js';

export const ListDirectoryInputSchema = z.object({
  path: z.string().default('.').describe('Directory path relative to workspace root'),
  recursive: z.boolean().default(false).describe('Whether to list recursively'),
  max_depth: z.number().default(2).describe('Maximum recursion depth'),
});

export type ListDirectoryInput = z.infer<typeof ListDirectoryInputSchema>;

export class ListDirectoryTool implements Tool<ListDirectoryInput> {
  public readonly metadata = {
    name: 'list_directory',
    description: 'List contents, sizes, and subdirectories within a directory path',
    category: 'filesystem' as const,
    risk: 'low' as const,
    filesystem: { read: true },
  };

  public readonly schema = ListDirectoryInputSchema;

  public async execute(args: ListDirectoryInput, context: ToolContext): Promise<ToolExecutionResult> {
    try {
      const targetDir = resolveSafeWorkspacePath(context.workspaceRoot, args.path || '.');
      const entries: Array<{ name: string; path: string; isDirectory: boolean; size?: number }> = [];

      await this.scanDir(targetDir, context.workspaceRoot, entries, args.recursive, 0, args.max_depth || 2);

      const lines = entries.map((e) => {
        const typeIcon = e.isDirectory ? '📁' : '📄';
        const sizeStr = e.size !== undefined ? ` (${(e.size / 1024).toFixed(1)} KB)` : '';
        return `${typeIcon} ${e.path}${sizeStr}`;
      });

      return {
        success: true,
        output: lines.length > 0 ? lines.join('\n') : '(empty directory)',
        data: {
          directory: args.path,
          totalEntries: entries.length,
          entries,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        output: `Error listing directory "${args.path}": ${err.message}`,
        error: err.message,
      };
    }
  }

  private async scanDir(
    dir: string,
    root: string,
    result: Array<{ name: string; path: string; isDirectory: boolean; size?: number }>,
    recursive: boolean,
    currentDepth: number,
    maxDepth: number
  ): Promise<void> {
    const files = await fs.readdir(dir, { withFileTypes: true });

    for (const f of files) {
      if (f.name === '.git' || f.name === 'node_modules' || f.name === '.DS_Store') continue;

      const fullPath = path.join(dir, f.name);
      const relPath = path.relative(root, fullPath);

      if (f.isDirectory()) {
        result.push({ name: f.name, path: relPath, isDirectory: true });
        if (recursive && currentDepth < maxDepth) {
          await this.scanDir(fullPath, root, result, recursive, currentDepth + 1, maxDepth);
        }
      } else {
        let size: number | undefined;
        try {
          const st = await fs.stat(fullPath);
          size = st.size;
        } catch {}
        result.push({ name: f.name, path: relPath, isDirectory: false, size });
      }
    }
  }
}
