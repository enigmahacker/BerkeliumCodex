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
            return {
                success: false,
                output: `Git branch error: ${err.message}`,
                error: err.message,
            };
        }
    }
}
//# sourceMappingURL=git-branch.js.map