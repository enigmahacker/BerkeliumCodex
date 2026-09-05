import { exec } from 'node:child_process';
import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';

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
    const cmd = 'npm run build';

    return new Promise((resolve) => {
      exec(cmd, { cwd: context.workspaceRoot, timeout: 60000 }, (error, stdout, stderr) => {
        const output = (stdout + (stderr ? '\n' + stderr : '')).trim();
        if (error) {
          resolve({
            success: false,
            output: output || error.message,
            error: 'BUILD_FAILED',
          });
        } else {
          resolve({
            success: true,
            output: output || '✓ Build completed successfully.',
          });
        }
      });
    });
  }
}
