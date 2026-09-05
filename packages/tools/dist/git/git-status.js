import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';
const execFileAsync = promisify(execFile);
export const GitStatusInputSchema = z.object({});
export class GitStatusTool {
    metadata = {
        name: 'git_status',
        description: 'Inspect current Git branch, modified files, staged files, and untracked files',
        category: 'git',
        risk: 'low',
    };
    schema = GitStatusInputSchema;
    async execute(_args, context) {
        try {
            const { stdout } = await execFileAsync('git', ['status', '--short', '--branch'], {
                cwd: context.workspaceRoot,
            });
            return {
                success: true,
                output: stdout.trim() || 'Working tree clean, no changes.',
                data: { raw: stdout },
            };
        }
        catch (err) {
            return {
                success: false,
                output: `Git status error: ${err.message}`,
                error: err.message,
            };
        }
    }
}
//# sourceMappingURL=git-status.js.map