import { exec } from 'node:child_process';
import { z } from 'zod';
export const LintInputSchema = z.object({
    fix: z.boolean().default(false).describe('Automatically apply safe lint fixes'),
});
export class LintTool {
    metadata = {
        name: 'lint',
        description: 'Run project linter (eslint, ruff, clippy, prettier)',
        category: 'diagnostics',
        risk: 'low',
    };
    schema = LintInputSchema;
    async execute(args, context) {
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
                }
                else {
                    resolve({
                        success: true,
                        output: output || '✓ Lint check clean.',
                    });
                }
            });
        });
    }
}
//# sourceMappingURL=lint.js.map