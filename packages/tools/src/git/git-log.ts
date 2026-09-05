import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';

const execFileAsync = promisify(execFile);

export const GitLogInputSchema = z.object({
  max_count: z.number().default(10).describe('Maximum number of commit entries to retrieve'),
});

export type GitLogInput = z.infer<typeof GitLogInputSchema>;

export class GitLogTool implements Tool<GitLogInput> {
  public readonly metadata = {
    name: 'git_log',
    description: 'Retrieve recent git commit history and messages',
    category: 'git' as const,
    risk: 'low' as const,
  };

  public readonly schema = GitLogInputSchema;

  public async execute(args: GitLogInput, context: ToolContext): Promise<ToolExecutionResult> {
    try {
      const { stdout } = await execFileAsync(
        'git',
        ['log', `--max-count=${args.max_count || 10}`, '--oneline', '--decorate'],
        { cwd: context.workspaceRoot }
      );

      return {
        success: true,
        output: stdout.trim() || '(no commits found)',
        data: { log: stdout },
      };
    } catch (err: any) {
      const msg = err.stderr || err.message || '';
      if (msg.includes('Not a git repository') || msg.includes('not a git repository')) {
        return {
          success: true,
          output: '(not a git repository — no commit history)',
          data: { isGitRepo: false },
        };
      }
      return {
        success: false,
        output: `Git log error: ${msg.split('\n')[0]}`,
        error: err.message,
      };
    }
  }
}
