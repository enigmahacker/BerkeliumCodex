import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';

const execFileAsync = promisify(execFile);

export const GitCommitInputSchema = z.object({
  message: z.string().describe('Git commit message'),
  add_all: z.boolean().default(true).describe('Stage all modified files before committing (-a)'),
});

export type GitCommitInput = z.infer<typeof GitCommitInputSchema>;

export class GitCommitTool implements Tool<GitCommitInput> {
  public readonly metadata = {
    name: 'git_commit',
    description: 'Create a new Git commit with staged or modified files',
    category: 'git' as const,
    risk: 'medium' as const,
  };

  public readonly schema = GitCommitInputSchema;

  public async execute(args: GitCommitInput, context: ToolContext): Promise<ToolExecutionResult> {
    try {
      if (args.add_all) {
        await execFileAsync('git', ['add', '-A'], { cwd: context.workspaceRoot });
      }

      const { stdout } = await execFileAsync('git', ['commit', '-m', args.message], {
        cwd: context.workspaceRoot,
      });

      return {
        success: true,
        output: stdout.trim(),
        data: { message: args.message },
      };
    } catch (err: any) {
      const msg = err.stderr || err.message || '';
      if (msg.includes('Not a git repository') || msg.includes('not a git repository')) {
        return {
          success: false,
          output: 'Cannot commit: workspace is not a git repository (run git init first)',
          error: 'NOT_A_GIT_REPOSITORY',
        };
      }
      return {
        success: false,
        output: `Git commit error: ${msg.split('\n')[0]}`,
        error: err.message,
      };
    }
  }
}
