import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export declare const SearchTextInputSchema: z.ZodObject<{
    query: z.ZodString;
    path: z.ZodDefault<z.ZodString>;
    is_regex: z.ZodDefault<z.ZodBoolean>;
    max_results: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    path: string;
    query: string;
    is_regex: boolean;
    max_results: number;
}, {
    query: string;
    path?: string | undefined;
    is_regex?: boolean | undefined;
    max_results?: number | undefined;
}>;
export type SearchTextInput = z.infer<typeof SearchTextInputSchema>;
export interface SearchMatch {
    file: string;
    lineNumber: number;
    lineContent: string;
}
export declare class SearchTextTool implements Tool<SearchTextInput> {
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
        query: z.ZodString;
        path: z.ZodDefault<z.ZodString>;
        is_regex: z.ZodDefault<z.ZodBoolean>;
        max_results: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        query: string;
        is_regex: boolean;
        max_results: number;
    }, {
        query: string;
        path?: string | undefined;
        is_regex?: boolean | undefined;
        max_results?: number | undefined;
    }>;
    execute(args: SearchTextInput, context: ToolContext): Promise<ToolExecutionResult>;
    private searchDir;
}
//# sourceMappingURL=search-text.d.ts.map