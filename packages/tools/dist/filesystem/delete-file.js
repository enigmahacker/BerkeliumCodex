import * as fs from 'node:fs/promises';
import { z } from 'zod';
import { resolveSafeWorkspacePath, canonicalizePath, SecurityPathError } from './path-utils.js';
export const DeleteFileInputSchema = z.object({
    path: z.string().describe('Relative or absolute file path to delete'),
});
export class DeleteFileTool {
    metadata = {
        name: 'delete_file',
        description: 'Delete a file from the workspace',
        category: 'filesystem',
        risk: 'high',
        requiresConfirmation: true,
        filesystem: { delete: true },
    };
    schema = DeleteFileInputSchema;
    async execute(args, context) {
        try {
            const fullPath = resolveSafeWorkspacePath(context.workspaceRoot, args.path);
            const canonicalRoot = canonicalizePath(context.workspaceRoot);
            // Block attempt to delete workspace root itself or filesystem root
            if (fullPath === canonicalRoot || fullPath === '/' || args.path === '.' || args.path === './') {
                throw new SecurityPathError('Refusing to delete workspace root or filesystem root.', args.path);
            }
            await fs.unlink(fullPath);
            return {
                success: true,
                output: `Successfully deleted file "${args.path}".`,
                data: { path: args.path },
            };
        }
        catch (err) {
            return {
                success: false,
                output: `Error deleting file "${args.path}": ${err.message}`,
                error: err.message,
            };
        }
    }
}
//# sourceMappingURL=delete-file.js.map