import { exec } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';

export const TestInputSchema = z.object({
  filter: z.string().optional().describe('Specific test file or test name pattern to run'),
});

export type TestInput = z.infer<typeof TestInputSchema>;

export class TestTool implements Tool<TestInput> {
  public readonly metadata = {
    name: 'test',
    description: 'Auto-detect and run workspace test suite (vitest, jest, pytest, cargo test, npm test)',
    category: 'diagnostics' as const,
    risk: 'low' as const,
  };

  public readonly schema = TestInputSchema;

  public async execute(args: TestInput, context: ToolContext): Promise<ToolExecutionResult> {
    try {
      const files = await fs.readdir(context.workspaceRoot);
      let cmd = 'npm test';

      if (files.includes('pnpm-lock.yaml')) {
        cmd = 'pnpm test';
      } else if (files.includes('yarn.lock')) {
        cmd = 'yarn test';
      } else if (files.includes('Cargo.toml')) {
        cmd = 'cargo test';
      } else if (files.includes('pyproject.toml') || files.includes('pytest.ini')) {
        cmd = 'pytest';
      }

      if (args.filter) {
        cmd += ` ${args.filter}`;
      }

      return new Promise((resolve) => {
        exec(cmd, { cwd: context.workspaceRoot, timeout: 60000, env: { ...process.env, CI: '1' } }, (error, stdout, stderr) => {
          const output = (stdout + (stderr ? '\n' + stderr : '')).trim();
          if (error) {
            resolve({
              success: false,
              output: output || error.message,
              error: 'TEST_SUITE_FAILED',
              metadata: { exitCode: error.code },
            });
          } else {
            resolve({
              success: true,
              output: output || '✓ All tests passed successfully.',
              metadata: { exitCode: 0 },
            });
          }
        });
      });
    } catch (err: any) {
      return {
        success: false,
        output: `Test execution error: ${err.message}`,
        error: err.message,
      };
    }
  }
}
