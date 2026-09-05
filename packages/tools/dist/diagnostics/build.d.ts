import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export declare const BuildInputSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export type BuildInput = z.infer<typeof BuildInputSchema>;
export declare class BuildTool implements Tool<BuildInput> {
    readonly metadata: {
        name: string;
        description: string;
        category: "diagnostics";
        risk: "medium";
    };
    readonly schema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
    execute(_args: BuildInput, context: ToolContext): Promise<ToolExecutionResult>;
}
//# sourceMappingURL=build.d.ts.map