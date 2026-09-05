import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export declare const ListDirectoryInputSchema: z.ZodObject<{
    path: z.ZodDefault<z.ZodString>;
    recursive: z.ZodDefault<z.ZodBoolean>;
    max_depth: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    path: string;
    recursive: boolean;
    max_depth: number;
}, {
    path?: string | undefined;
    recursive?: boolean | undefined;
    max_depth?: number | undefined;
}>;
export type ListDirectoryInput = z.infer<typeof ListDirectoryInputSchema>;
export declare class ListDirectoryTool implements Tool<ListDirectoryInput> {
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
        path: z.ZodDefault<z.ZodString>;
        recursive: z.ZodDefault<z.ZodBoolean>;
        max_depth: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        recursive: boolean;
        max_depth: number;
    }, {
        path?: string | undefined;
        recursive?: boolean | undefined;
        max_depth?: number | undefined;
    }>;
    execute(args: ListDirectoryInput, context: ToolContext): Promise<ToolExecutionResult>;
    private scanDir;
}
//# sourceMappingURL=list-directory.d.ts.map