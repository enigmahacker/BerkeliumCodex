import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';
export const WriteFileInputSchema = z.object({
    path: z.string().describe('Relative or absolute file path to create/overwrite'),
    content: z.string().describe('The content to write into the file'),
});
export class WriteFileTool {
    metadata = {
        name: 'write_file',
        description: 'Write or create a complete file in the workspace',
        category: 'filesystem',
        risk: 'medium',
        filesystem: { write: true },
    };
    schema = WriteFileInputSchema;
    async execute(args, context) {
        try {
            const fullPath = path.resolve(context.workspaceRoot, args.path);
            const parentDir = path.dirname(fullPath);
            await fs.mkdir(parentDir, { recursive: true });
            await fs.writeFile(fullPath, args.content, 'utf-8');
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