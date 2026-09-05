import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export declare const LintInputSchema: z.ZodObject<{
    fix: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    fix: boolean;
}, {
    fix?: boolean | undefined;
}>;
export type LintInput = z.infer<typeof LintInputSchema>;
export declare class LintTool implements Tool<LintInput> {
    readonly metadata: {
        name: string;
        description: string;
        category: "diagnostics";
        risk: "low";
    };
    readonly schema: z.ZodObject<{
        fix: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        fix: boolean;
    }, {
        fix?: boolean | undefined;
    }>;
    execute(args: LintInput, context: ToolContext): Promise<ToolExecutionResult>;
}
//# sourceMappingURL=lint.d.ts.map