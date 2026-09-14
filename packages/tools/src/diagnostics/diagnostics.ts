import { exec } from 'node:child_process';
import * as fs from 'node:fs/promises';
import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';

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
      let cmd = '';

      if (files.includes('tsconfig.json') || files.includes('package.json')) {
        cmd = 'npx tsc --noEmit --pretty false';
      } else if (files.includes('Cargo.toml')) {
        cmd = 'cargo check --message-format=short';
      } else if (files.includes('pyproject.toml') || files.includes('mypy.ini')) {
        cmd = 'mypy .';
      } else {
        return {
          success: true,
          output: 'No known typechecker or compiler config detected in workspace.',
          data: { status: 'CLEAN' as DiagnosticsStatus, exitCode: 0 },
        };
      }

      return new Promise((resolve) => {
        exec(cmd, { cwd: context.workspaceRoot, timeout: 30000 }, (error, stdout, stderr) => {
          const output = (stdout + '\n' + stderr).trim();
          if (error) {
            // Check if failure is due to command execution failure or compiler reporting issues
            const isCompilerIssues = typeof error.code === 'number' && error.code > 0 && output.length > 0;
            if (isCompilerIssues) {
              // ISSUES_FOUND is not a tool failure; tool successfully reported code issues
              resolve({
                success: true,
                output: output,
                data: {
                  status: 'ISSUES_FOUND' as DiagnosticsStatus,
                  exitCode: error.code,
                  issueCount: output.split('\n').filter(l => l.includes('error TS') || l.includes('error:')).length,
                },
              });
            } else {
              // Tool execution failed (command not found, killed, timeout, etc.)
              resolve({
                success: false,
                output: output || error.message,
                error: 'TOOL_FAILED',
                data: {
                  status: 'TOOL_FAILED' as DiagnosticsStatus,
                  exitCode: error.code,
                  error: error.message,
                },
              });
            }
          } else {
            resolve({
              success: true,
              output: output || '✓ Diagnostics clean. Zero errors found.',
              data: { status: 'CLEAN' as DiagnosticsStatus, exitCode: 0 },
            });
          }
        });
      });
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
