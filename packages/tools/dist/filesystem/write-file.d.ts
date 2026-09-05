import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export declare const WriteFileInputSchema: z.ZodObject<{
    path: z.ZodString;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
    content: string;
}, {
    path: string;
    content: string;
}>;
export type WriteFileInput = z.infer<typeof WriteFileInputSchema>;
export declare class WriteFileTool implements Tool<WriteFileInput> {
    readonly metadata: {
        name: string;
        description: string;
        category: "filesystem";
        risk: "medium";
        filesystem: {
            write: boolean;
        };
    };
    readonly schema: z.ZodObject<{
        path: z.ZodString;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        content: string;
    }, {
        path: string;
        content: string;
    }>;
    execute(args: WriteFileInput, context: ToolContext): Promise<ToolExecutionResult>;
}
//# sourceMappingURL=write-file.d.ts.map