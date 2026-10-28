import * as fs from 'node:fs/promises';
import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
import { RunProcessTool } from '../shell/run-process.js';

export const DiagnosticsInputSchema = z.object({
  path: z.string().optional().describe('Specific path or file to check'),
});

export type DiagnosticsInput = z.infer<typeof DiagnosticsInputSchema>;

export type DiagnosticsStatus = 'CLEAN' | 'ISSUES_FOUND' | 'TOOL_FAILED';

export class DiagnosticsTool implements Tool<DiagnosticsInput> {
  public readonly metadata = {
    name: 'diagnostics',
    description: 'Run compiler and typechecker diagnostics (tsc, pyright, cargo check) to locate errors and warnings',
    category: 'diagnostics' as const,
    risk: 'low' as const,
  };

  public readonly schema = DiagnosticsInputSchema;

  public async execute(args: DiagnosticsInput, context: ToolContext): Promise<ToolExecutionResult> {
    try {
      const files = await fs.readdir(context.workspaceRoot);
      let executable = '';
      let processArgs: string[] = [];

      if (files.includes('tsconfig.json') || files.includes('package.json')) {
        executable = 'npx';
        processArgs = ['tsc', '--noEmit', '--pretty', 'false'];
      } else if (files.includes('Cargo.toml')) {
        executable = 'cargo';
        processArgs = ['check', '--message-format=short'];
      } else if (files.includes('pyproject.toml') || files.includes('mypy.ini')) {
        executable = 'mypy';
        processArgs = ['.'];
      } else {
        return {
          success: true,
          output: 'No known typechecker or compiler config detected in workspace.',
          data: { status: 'CLEAN' as DiagnosticsStatus, exitCode: 0 },
        };
      }

      const result = await new RunProcessTool().execute(
        { executable, args: processArgs, timeout_ms: 30000 },
        context
      );
      const output = result.output;
      const exitCode = result.metadata?.exitCode;

      if (!result.success && typeof exitCode === 'number' && exitCode > 0 && output.length > 0) {
        return {
          success: true,
          output,
          data: {
            status: 'ISSUES_FOUND' as DiagnosticsStatus,
            exitCode,
            issueCount: output.split('\n').filter((line) => line.includes('error TS') || line.includes('error:')).length,
          },
        };
      }

      if (!result.success) {
        return {
          success: false,
          output,
          error: 'TOOL_FAILED',
          data: {
            status: 'TOOL_FAILED' as DiagnosticsStatus,
            exitCode,
            error: result.error,
          },
        };
      }

      return {
        success: true,
        output: output || '✓ Diagnostics clean. Zero errors found.',
        data: { status: 'CLEAN' as DiagnosticsStatus, exitCode: 0 },
      };
    } catch (err: any) {
      return {
        success: false,
        output: `Diagnostics error: ${err.message}`,
        error: 'TOOL_FAILED',
        data: { status: 'TOOL_FAILED' as DiagnosticsStatus, error: err.message },
      };
    }
  }
}
