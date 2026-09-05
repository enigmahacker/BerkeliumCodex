import { exec } from 'node:child_process';
import { z } from 'zod';
export const BuildInputSchema = z.object({});
export class BuildTool {
    metadata = {
        name: 'build',
        description: 'Execute project compilation or build scripts',
        category: 'diagnostics',
        risk: 'medium',
    };
    schema = BuildInputSchema;
    async execute(_args, context) {
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
                }
                else {
                    resolve({
                        success: true,
                        output: output || '✓ Build completed successfully.',
                    });
                }
            });
        });
    }
}
//# sourceMappingURL=build.js.map