import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';

const execFileAsync = promisify(execFile);

export const GitDiffInputSchema = z.object({
  staged: z.boolean().default(false).describe('View staged changes only (--cached)'),
  file: z.string().optional().describe('Specific file to diff'),
});

export type GitDiffInput = z.infer<typeof GitDiffInputSchema>;

export class GitDiffTool implements Tool<GitDiffInput> {
  public readonly metadata = {
    name: 'git_diff',
    description: 'Show code changes in the working tree or staging area',
    category: 'git' as const,
    risk: 'low' as const,
  };

  public readonly schema = GitDiffInputSchema;

  public async execute(args: GitDiffInput, context: ToolContext): Promise<ToolExecutionResult> {
    try {
      const gitArgs = ['diff'];
      if (args.staged) gitArgs.push('--cached');
      if (args.file) gitArgs.push('--', args.file);

      const { stdout } = await execFileAsync('git', gitArgs, {
        cwd: context.workspaceRoot,
        maxBuffer: 10 * 1024 * 1024,
      });

      return {
        success: true,
        output: stdout.trim() || '(no diff detected)',
        data: { diff: stdout },
      };
    } catch (err: any) {
      const msg = err.stderr || err.message || '';
      if (msg.includes('Not a git repository') || msg.includes('not a git repository')) {
        return {
          success: true,
          output: '(not a git repository — workspace is untracked)',
          data: { isGitRepo: false },
        };
      }
      return {
        success: false,
        output: `Git diff error: ${msg.split('\n')[0]}`,
        error: err.message,
      };
    }
  }
}
