import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export declare const EditFileInputSchema: z.ZodObject<{
    path: z.ZodString;
    target: z.ZodString;
    replacement: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
    target: string;
    replacement: string;
}, {
    path: string;
    target: string;
    replacement: string;
}>;
export type EditFileInput = z.infer<typeof EditFileInputSchema>;
export declare class EditFileTool implements Tool<EditFileInput> {
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
        target: z.ZodString;
        replacement: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        target: string;
        replacement: string;
    }, {
        path: string;
        target: string;
        replacement: string;
    }>;
    execute(args: EditFileInput, context: ToolContext): Promise<ToolExecutionResult>;
}
//# sourceMappingURL=edit-file.d.ts.map