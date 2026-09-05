import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export declare const DeleteFileInputSchema: z.ZodObject<{
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
}, {
    path: string;
}>;
export type DeleteFileInput = z.infer<typeof DeleteFileInputSchema>;
export declare class DeleteFileTool implements Tool<DeleteFileInput> {
    readonly metadata: {
        name: string;
        description: string;
        category: "filesystem";
        risk: "high";
        requiresConfirmation: boolean;
        filesystem: {
            delete: boolean;
        };
    };
    readonly schema: z.ZodObject<{
        path: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
    }, {
        path: string;
    }>;
    execute(args: DeleteFileInput, context: ToolContext): Promise<ToolExecutionResult>;
}
//# sourceMappingURL=delete-file.d.ts.map