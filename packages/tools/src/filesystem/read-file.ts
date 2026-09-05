import * as fs from 'node:fs/promises';
import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
import { resolveSafeWorkspacePath } from './path-utils.js';

export const ReadFileInputSchema = z.object({
  path: z.string().describe('Relative or absolute file path to read'),
  start_line: z.number().optional().describe('1-indexed starting line number'),
  end_line: z.number().optional().describe('1-indexed ending line number (inclusive)'),
});

export type ReadFileInput = z.infer<typeof ReadFileInputSchema>;

export class ReadFileTool implements Tool<ReadFileInput> {
  public readonly metadata = {
    name: 'read_file',
    description: 'Read contents of a file from the workspace with optional line ranges',
    category: 'filesystem' as const,
    risk: 'low' as const,
    filesystem: { read: true },
  };

  public readonly schema = ReadFileInputSchema;

  public async execute(args: ReadFileInput, context: ToolContext): Promise<ToolExecutionResult> {
    try {
      const fullPath = resolveSafeWorkspacePath(context.workspaceRoot, args.path);
      const content = await fs.readFile(fullPath, 'utf-8');
      const lines = content.split('\n');

      let selectedLines = lines;
      let startIdx = 1;
      let endIdx = lines.length;

      if (args.start_line !== undefined && args.start_line > 0) {
        startIdx = args.start_line;
      }
      if (args.end_line !== undefined && args.end_line >= startIdx) {
        endIdx = Math.min(args.end_line, lines.length);
      }

      selectedLines = lines.slice(startIdx - 1, endIdx);
      const formatted = selectedLines
        .map((line, idx) => `${String(startIdx + idx).padStart(5, ' ')} | ${line}`)
        .join('\n');

      return {
        success: true,
        output: formatted,
        data: {
          path: args.path,
          totalLines: lines.length,
          startLine: startIdx,
          endLine: endIdx,
          rawContent: selectedLines.join('\n'),
        },
      };
    } catch (err: any) {
      return {
        success: false,
        output: `Error reading file "${args.path}": ${err.message}`,
        error: err.message,
      };
    }
  }
}
