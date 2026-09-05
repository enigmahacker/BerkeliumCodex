import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { z } from 'zod';
import { resolveSafeWorkspacePath } from './path-utils.js';
export const WriteFileInputSchema = z.object({
    path: z.string().describe('Relative or absolute file path to create/overwrite'),
    content: z.string().describe('The content to write into the file'),
});
export class WriteFileTool {
    metadata = {
        name: 'write_file',
        description: 'Write or create a complete file safely in the workspace',
        category: 'filesystem',
        risk: 'medium',
        filesystem: { write: true },
    };
    schema = WriteFileInputSchema;
    async execute(args, context) {
        try {
            const fullPath = resolveSafeWorkspacePath(context.workspaceRoot, args.path);
            const parentDir = path.dirname(fullPath);
            await fs.mkdir(parentDir, { recursive: true });
            // Atomic write: write to unique temporary file in same folder, then rename
            const tempPath = path.join(parentDir, `.bk_tmp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`);
            await fs.writeFile(tempPath, args.content, 'utf-8');
            await fs.rename(tempPath, fullPath);
            return {
                success: true,
                output: `Successfully wrote ${args.content.length} characters to "${args.path}".`,
                data: {
                    path: args.path,
                    bytes: Buffer.byteLength(args.content, 'utf-8'),
                },
            };
        }
        catch (err) {
            return {
                success: false,
                output: `Error writing file "${args.path}": ${err.message}`,
                error: err.message,
            };
        }
    }
}
//# sourceMappingURL=write-file.js.map