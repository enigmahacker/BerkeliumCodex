import { exec } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';

export const DiagnosticsInputSchema = z.object({
  path: z.string().optional().describe('Specific path or file to check'),
});

export type DiagnosticsInput = z.infer<typeof DiagnosticsInputSchema>;

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
        };
      }

      return new Promise((resolve) => {
        exec(cmd, { cwd: context.workspaceRoot, timeout: 30000 }, (error, stdout, stderr) => {
          const output = (stdout + '\n' + stderr).trim();
          if (error) {
            resolve({
              success: false,
              output: output || error.message,
              error: 'DIAGNOSTICS_FOUND_ERRORS',
              data: { exitCode: error.code },
            });
          } else {
            resolve({
              success: true,
              output: output || '✓ Diagnostics clean. Zero errors found.',
            });
          }
        });
      });
    } catch (err: any) {
      return {
        success: false,
        output: `Diagnostics error: ${err.message}`,
        error: err.message,
      };
    }
  }
}
