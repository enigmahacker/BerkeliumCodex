import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
import { RunProcessTool } from '../shell/run-process.js';

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
    const processArgs = ['run', 'lint'];
    if (args.fix) processArgs.push('--', '--fix');

    const result = await new RunProcessTool().execute(
      { executable: 'npm', args: processArgs, timeout_ms: 30000 },
      context
    );

    if (!result.success) {
      return { ...result, error: 'LINT_ISSUES_FOUND' };
    }

    return {
      ...result,
      output: result.output || '✓ Lint check clean.',
    };
  }
}
