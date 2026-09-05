import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export declare const GitBranchInputSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export type GitBranchInput = z.infer<typeof GitBranchInputSchema>;
export declare class GitBranchTool implements Tool<GitBranchInput> {
    readonly metadata: {
        name: string;
        description: string;
        category: "git";
        risk: "low";
    };
    readonly schema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
    execute(_args: GitBranchInput, context: ToolContext): Promise<ToolExecutionResult>;
}
//# sourceMappingURL=git-branch.d.ts.map