import { exec } from 'node:child_process';
import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';

export const LintInputSchema = z.object({
  fix: z.boolean().default(false).describe('Automatically apply safe lint fixes'),
});

export type LintInput = z.infer<typeof LintInputSchema>;

export class LintTool implements Tool<LintInput> {
  public readonly metadata = {
    name: 'lint',
    description: 'Run project linter (eslint, ruff, clippy, prettier)',
    category: 'diagnostics' as const,
    risk: 'low' as const,
  };

  public readonly schema = LintInputSchema;

  public async execute(args: LintInput, context: ToolContext): Promise<ToolExecutionResult> {
    const cmd = args.fix ? 'npm run lint -- --fix' : 'npm run lint';

    return new Promise((resolve) => {
      exec(cmd, { cwd: context.workspaceRoot, timeout: 30000 }, (error, stdout, stderr) => {
        const output = (stdout + (stderr ? '\n' + stderr : '')).trim();
        if (error) {
          resolve({
            success: false,
            output: output || error.message,
            error: 'LINT_ISSUES_FOUND',
          });
        } else {
          resolve({
            success: true,
            output: output || '✓ Lint check clean.',
          });
        }
      });
    });
  }
}
