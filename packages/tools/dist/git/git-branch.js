import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';
const execFileAsync = promisify(execFile);
export const GitBranchInputSchema = z.object({});
export class GitBranchTool {
    metadata = {
        name: 'git_branch',
        description: 'List local git branches and active branch name',
        category: 'git',
        risk: 'low',
    };
    schema = GitBranchInputSchema;
    async execute(_args, context) {
        try {
            const { stdout } = await execFileAsync('git', ['branch', '-a'], {
                cwd: context.workspaceRoot,
            });
            return {
                success: true,
                output: stdout.trim() || '(no branches found)',
                data: { branches: stdout },
            };
        }
        catch (err) {
            const msg = err.stderr || err.message || '';
            if (msg.includes('Not a git repository') || msg.includes('not a git repository')) {
                return {
                    success: true,
                    output: '(not a git repository — no branches)',
                    data: { isGitRepo: false },
                };
            }
            return {
                success: false,
                output: `Git branch error: ${msg.split('\n')[0]}`,
                error: err.message,
            };
        }
    }
}
//# sourceMappingURL=git-branch.js.map