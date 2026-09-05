import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export declare const GitLogInputSchema: z.ZodObject<{
    max_count: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    max_count: number;
}, {
    max_count?: number | undefined;
}>;
export type GitLogInput = z.infer<typeof GitLogInputSchema>;
export declare class GitLogTool implements Tool<GitLogInput> {
    readonly metadata: {
        name: string;
        description: string;
        category: "git";
        risk: "low";
    };
    readonly schema: z.ZodObject<{
        max_count: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        max_count: number;
    }, {
        max_count?: number | undefined;
    }>;
    execute(args: GitLogInput, context: ToolContext): Promise<ToolExecutionResult>;
}
//# sourceMappingURL=git-log.d.ts.map