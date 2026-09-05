import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { z } from 'zod';
import { resolveSafeWorkspacePath } from './path-utils.js';
export const EditFileInputSchema = z.object({
    path: z.string().describe('Relative or absolute file path to edit'),
    target: z.string().describe('Exact target string or lines of code to replace'),
    replacement: z.string().describe('Replacement string or lines of code'),
});
export class EditFileTool {
    metadata = {
        name: 'edit_file',
        description: 'Surgically replace target lines/text in a file with replacement content',
        category: 'filesystem',
        risk: 'medium',
        filesystem: { write: true },
    };
    schema = EditFileInputSchema;
    async execute(args, context) {
        try {
            const fullPath = resolveSafeWorkspacePath(context.workspaceRoot, args.path);
            const content = await fs.readFile(fullPath, 'utf-8');
            if (!content.includes(args.target)) {
                return {
                    success: false,
                    output: `Target content not found in "${args.path}". Verify that whitespace and indentation match exactly.`,
                    error: 'TARGET_NOT_FOUND',
                };
            }
            // Check for multiple occurrences
            const matches = content.split(args.target).length - 1;
            if (matches > 1) {
                return {
                    success: false,
                    output: `Target content occurs ${matches} times in "${args.path}". Please provide more surrounding context to make target unique.`,
                    error: 'AMBIGUOUS_TARGET',
                };
            }
            const updated = content.replace(args.target, args.replacement);
            // Atomic write
            const parentDir = path.dirname(fullPath);
            const tempPath = path.join(parentDir, `.bk_tmp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`);
            await fs.writeFile(tempPath, updated, 'utf-8');
            await fs.rename(tempPath, fullPath);
            return {
                success: true,
                output: `Successfully applied edit to "${args.path}".`,
                data: {
                    path: args.path,
                    charactersChanged: args.replacement.length - args.target.length,
                },
            };
        }
        catch (err) {
            return {
                success: false,
                output: `Error editing file "${args.path}": ${err.message}`,
                error: err.message,
            };
        }
    }
}
//# sourceMappingURL=edit-file.js.map