import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export declare const GitDiffInputSchema: z.ZodObject<{
    staged: z.ZodDefault<z.ZodBoolean>;
    file: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    staged: boolean;
    file?: string | undefined;
}, {
    staged?: boolean | undefined;
    file?: string | undefined;
}>;
export type GitDiffInput = z.infer<typeof GitDiffInputSchema>;
export declare class GitDiffTool implements Tool<GitDiffInput> {
    readonly metadata: {
        name: string;
        description: string;
        category: "git";
        risk: "low";
    };
    readonly schema: z.ZodObject<{
        staged: z.ZodDefault<z.ZodBoolean>;
        file: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        staged: boolean;
        file?: string | undefined;
    }, {
        staged?: boolean | undefined;
        file?: string | undefined;
    }>;
    execute(args: GitDiffInput, context: ToolContext): Promise<ToolExecutionResult>;
}
//# sourceMappingURL=git-diff.d.ts.map