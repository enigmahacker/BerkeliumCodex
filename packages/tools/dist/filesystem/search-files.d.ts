import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export declare const SearchFilesInputSchema: z.ZodObject<{
    pattern: z.ZodString;
    path: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    path: string;
    pattern: string;
}, {
    pattern: string;
    path?: string | undefined;
}>;
export type SearchFilesInput = z.infer<typeof SearchFilesInputSchema>;
export declare class SearchFilesTool implements Tool<SearchFilesInput> {
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
        pattern: z.ZodString;
        path: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        pattern: string;
    }, {
        pattern: string;
        path?: string | undefined;
    }>;
    execute(args: SearchFilesInput, context: ToolContext): Promise<ToolExecutionResult>;
    private find;
}
//# sourceMappingURL=search-files.d.ts.map