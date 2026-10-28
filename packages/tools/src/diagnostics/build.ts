import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
import { RunProcessTool } from '../shell/run-process.js';

export const BuildInputSchema = z.object({});
export type BuildInput = z.infer<typeof BuildInputSchema>;

export class BuildTool implements Tool<BuildInput> {
  public readonly metadata = {
    name: 'build',
    description: 'Execute project compilation or build scripts',
    category: 'diagnostics' as const,
    risk: 'medium' as const,
  };

  public readonly schema = BuildInputSchema;

  public async execute(_args: BuildInput, context: ToolContext): Promise<ToolExecutionResult> {
    const result = await new RunProcessTool().execute(
      { executable: 'npm', args: ['run', 'build'], timeout_ms: 60000 },
      context
    );

    if (!result.success) {
      return { ...result, error: 'BUILD_FAILED' };
    }

    return {
      ...result,
      output: result.output || '✓ Build completed successfully.',
    };
  }
}
