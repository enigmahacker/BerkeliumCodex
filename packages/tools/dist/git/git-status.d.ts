import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export declare const GitStatusInputSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export type GitStatusInput = z.infer<typeof GitStatusInputSchema>;
export declare class GitStatusTool implements Tool<GitStatusInput> {
    readonly metadata: {
        name: string;
        description: string;
        category: "git";
        risk: "low";
    };
    readonly schema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
    execute(_args: GitStatusInput, context: ToolContext): Promise<ToolExecutionResult>;
}
//# sourceMappingURL=git-status.d.ts.map