import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';

const execFileAsync = promisify(execFile);

export const GitStatusInputSchema = z.object({});
export type GitStatusInput = z.infer<typeof GitStatusInputSchema>;

export class GitStatusTool implements Tool<GitStatusInput> {
  public readonly metadata = {
    name: 'git_status',
    description: 'Inspect current Git branch, modified files, staged files, and untracked files',
    category: 'git' as const,
    risk: 'low' as const,
  };

  public readonly schema = GitStatusInputSchema;

  public async execute(_args: GitStatusInput, context: ToolContext): Promise<ToolExecutionResult> {
    try {
      const { stdout } = await execFileAsync('git', ['status', '--short', '--branch'], {
        cwd: context.workspaceRoot,
      });

      return {
        success: true,
        output: stdout.trim() || 'Working tree clean, no changes.',
        data: { raw: stdout },
      };
    } catch (err: any) {
      return {
        success: false,
        output: `Git status error: ${err.message}`,
        error: err.message,
      };
    }
  }
}
