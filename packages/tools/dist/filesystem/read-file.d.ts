import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export declare const ReadFileInputSchema: z.ZodObject<{
    path: z.ZodString;
    start_line: z.ZodOptional<z.ZodNumber>;
    end_line: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    path: string;
    start_line?: number | undefined;
    end_line?: number | undefined;
}, {
    path: string;
    start_line?: number | undefined;
    end_line?: number | undefined;
}>;
export type ReadFileInput = z.infer<typeof ReadFileInputSchema>;
export declare class ReadFileTool implements Tool<ReadFileInput> {
    readonly metadata: {
        name: string;
        description: string;
        category: "filesystem";
        risk: "low";
        filesystem: {
            read: boolean;
        };
    };
    readonly schema: z.ZodObject<{
        path: z.ZodString;
        start_line: z.ZodOptional<z.ZodNumber>;
        end_line: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        start_line?: number | undefined;
        end_line?: number | undefined;
    }, {
        path: string;
        start_line?: number | undefined;
        end_line?: number | undefined;
    }>;
    execute(args: ReadFileInput, context: ToolContext): Promise<ToolExecutionResult>;
}
//# sourceMappingURL=read-file.d.ts.map