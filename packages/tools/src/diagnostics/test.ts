import * as fs from 'node:fs/promises';
import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
import { RunProcessTool } from '../shell/run-process.js';

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
      let executable = 'npm';
      let processArgs = ['test'];

      if (files.includes('pnpm-lock.yaml')) {
        executable = 'pnpm';
      } else if (files.includes('yarn.lock')) {
        executable = 'yarn';
      } else if (files.includes('Cargo.toml')) {
        executable = 'cargo';
      } else if (files.includes('pyproject.toml') || files.includes('pytest.ini')) {
        executable = 'pytest';
        processArgs = [];
      } else if (!files.includes('package.json')) {
        return {
          success: true,
          output: '(no test runner or test suite configured in workspace)',
        };
      }

      if (args.filter) {
        processArgs.push(args.filter);
      }

      const result = await new RunProcessTool().execute(
        { executable, args: processArgs, timeout_ms: 60000 },
        context
      );
      const output = result.output;

      if (
        !result.success &&
        (output.includes('Missing script: "test"') ||
          output.includes('missing script: test') ||
          output.includes('no test specified') ||
          output.includes('npm ERR! missing script: test'))
      ) {
        return {
          success: true,
          output: '(no test script specified in package.json)',
          metadata: { exitCode: 0 },
        };
      }

      if (!result.success) {
        return { ...result, error: 'TEST_SUITE_FAILED' };
      }

      return {
        ...result,
        output: output || '✓ All tests passed successfully.',
      };
    } catch (err: any) {
      return {
        success: false,
        output: `Test execution error: ${err.message}`,
        error: err.message,
      };
    }
  }
}
