import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';

export const DeleteFileInputSchema = z.object({
  path: z.string().describe('Relative or absolute file path to delete'),
});

export type DeleteFileInput = z.infer<typeof DeleteFileInputSchema>;

export class DeleteFileTool implements Tool<DeleteFileInput> {
  public readonly metadata = {
    name: 'delete_file',
    description: 'Delete a file from the workspace',
    category: 'filesystem' as const,
    risk: 'high' as const,
    requiresConfirmation: true,
    filesystem: { delete: true },
  };

  public readonly schema = DeleteFileInputSchema;

  public async execute(args: DeleteFileInput, context: ToolContext): Promise<ToolExecutionResult> {
    try {
      const fullPath = path.resolve(context.workspaceRoot, args.path);
      await fs.unlink(fullPath);

      return {
        success: true,
        output: `Successfully deleted file "${args.path}".`,
        data: { path: args.path },
      };
    } catch (err: any) {
      return {
        success: false,
        output: `Error deleting file "${args.path}": ${err.message}`,
        error: err.message,
      };
    }
  }
}
