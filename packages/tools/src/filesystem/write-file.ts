import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';

export const WriteFileInputSchema = z.object({
  path: z.string().describe('Relative or absolute file path to create/overwrite'),
  content: z.string().describe('The content to write into the file'),
});

export type WriteFileInput = z.infer<typeof WriteFileInputSchema>;

export class WriteFileTool implements Tool<WriteFileInput> {
  public readonly metadata = {
    name: 'write_file',
    description: 'Write or create a complete file in the workspace',
    category: 'filesystem' as const,
    risk: 'medium' as const,
    filesystem: { write: true },
  };

  public readonly schema = WriteFileInputSchema;

  public async execute(args: WriteFileInput, context: ToolContext): Promise<ToolExecutionResult> {
    try {
      const fullPath = path.resolve(context.workspaceRoot, args.path);
      const parentDir = path.dirname(fullPath);

      await fs.mkdir(parentDir, { recursive: true });
      await fs.writeFile(fullPath, args.content, 'utf-8');

      return {
        success: true,
        output: `Successfully wrote ${args.content.length} characters to "${args.path}".`,
        data: {
          path: args.path,
          bytes: Buffer.byteLength(args.content, 'utf-8'),
        },
      };
    } catch (err: any) {
      return {
        success: false,
        output: `Error writing file "${args.path}": ${err.message}`,
        error: err.message,
      };
    }
  }
}
