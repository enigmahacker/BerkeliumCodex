import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';
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
            const fullPath = path.resolve(context.workspaceRoot, args.path);
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