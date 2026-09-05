import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';

export const EditFileInputSchema = z.object({
  path: z.string().describe('Relative or absolute file path to edit'),
  target: z.string().describe('Exact target string or lines of code to replace'),
  replacement: z.string().describe('Replacement string or lines of code'),
});

export type EditFileInput = z.infer<typeof EditFileInputSchema>;

export class EditFileTool implements Tool<EditFileInput> {
  public readonly metadata = {
    name: 'edit_file',
    description: 'Surgically replace target lines/text in a file with replacement content',
    category: 'filesystem' as const,
    risk: 'medium' as const,
    filesystem: { write: true },
  };

  public readonly schema = EditFileInputSchema;

  public async execute(args: EditFileInput, context: ToolContext): Promise<ToolExecutionResult> {
    try {
      const fullPath = path.resolve(context.workspaceRoot, args.path);
      const content = await fs.readFile(fullPath, 'utf-8');

      if (!content.includes(args.target)) {
        return {
          success: false,
          output: `Target content not found in "${args.path}". Verify that whitespace and indentation match exactly.`,
          error: 'TARGET_NOT_FOUND',
        };
      }

      // Check for multiple occurrences
      const matches = content.split(args.target).length - 1;
      if (matches > 1) {
        return {
          success: false,
          output: `Target content occurs ${matches} times in "${args.path}". Please provide more surrounding context to make target unique.`,
          error: 'AMBIGUOUS_TARGET',
        };
      }

      const updated = content.replace(args.target, args.replacement);
      await fs.writeFile(fullPath, updated, 'utf-8');

      return {
        success: true,
        output: `Successfully applied edit to "${args.path}".`,
        data: {
          path: args.path,
          charactersChanged: args.replacement.length - args.target.length,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        output: `Error editing file "${args.path}": ${err.message}`,
        error: err.message,
      };
    }
  }
}
