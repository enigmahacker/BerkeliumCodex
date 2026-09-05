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
            const msg = err.stderr || err.message || '';
            if (msg.includes('Not a git repository') || msg.includes('not a git repository')) {
                return {
                    success: true,
                    output: '(not a git repository — workspace is untracked)',
                    data: { isGitRepo: false },
                };
            }
            return {
                success: false,
                output: `Git status error: ${msg.split('\n')[0]}`,
                error: err.message,
            };
        }
    }
}
//# sourceMappingURL=git-status.js.map