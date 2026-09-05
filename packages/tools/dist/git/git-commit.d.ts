import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export declare const GitCommitInputSchema: z.ZodObject<{
    message: z.ZodString;
    add_all: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    message: string;
    add_all: boolean;
}, {
    message: string;
    add_all?: boolean | undefined;
}>;
export type GitCommitInput = z.infer<typeof GitCommitInputSchema>;
export declare class GitCommitTool implements Tool<GitCommitInput> {
    readonly metadata: {
        name: string;
        description: string;
        category: "git";
        risk: "medium";
    };
    readonly schema: z.ZodObject<{
        message: z.ZodString;
        add_all: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        add_all: boolean;
    }, {
        message: string;
        add_all?: boolean | undefined;
    }>;
    execute(args: GitCommitInput, context: ToolContext): Promise<ToolExecutionResult>;
}
//# sourceMappingURL=git-commit.d.ts.map