import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';
export const ReadFileInputSchema = z.object({
    path: z.string().describe('Relative or absolute file path to read'),
    start_line: z.number().optional().describe('1-indexed starting line number'),
    end_line: z.number().optional().describe('1-indexed ending line number (inclusive)'),
});
export class ReadFileTool {
    metadata = {
        name: 'read_file',
        description: 'Read contents of a file from the workspace with optional line ranges',
        category: 'filesystem',
        risk: 'low',
        filesystem: { read: true },
    };
    schema = ReadFileInputSchema;
    async execute(args, context) {
        try {
            const fullPath = path.resolve(context.workspaceRoot, args.path);
            const content = await fs.readFile(fullPath, 'utf-8');
            const lines = content.split('\n');
            let selectedLines = lines;
            let startIdx = 1;
            let endIdx = lines.length;
            if (args.start_line !== undefined && args.start_line > 0) {
                startIdx = args.start_line;
            }
            if (args.end_line !== undefined && args.end_line >= startIdx) {
                endIdx = Math.min(args.end_line, lines.length);
            }
            selectedLines = lines.slice(startIdx - 1, endIdx);
            const formatted = selectedLines
                .map((line, idx) => `${String(startIdx + idx).padStart(5, ' ')} | ${line}`)
                .join('\n');
            return {
                success: true,
                output: formatted,
                data: {
                    path: args.path,
                    totalLines: lines.length,
                    startLine: startIdx,
                    endLine: endIdx,
                    rawContent: selectedLines.join('\n'),
                },
            };
        }
        catch (err) {
            return {
                success: false,
                output: `Error reading file "${args.path}": ${err.message}`,
                error: err.message,
            };
        }
    }
}
//# sourceMappingURL=read-file.js.map