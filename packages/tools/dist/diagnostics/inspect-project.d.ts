import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export declare const InspectProjectInputSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export type InspectProjectInput = z.infer<typeof InspectProjectInputSchema>;
export declare class InspectProjectTool implements Tool<InspectProjectInput> {
    readonly metadata: {
        name: string;
        description: string;
        category: "diagnostics";
        risk: "low";
        filesystem: {
            read: boolean;
        };
    };
    readonly schema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
    execute(_args: InspectProjectInput, context: ToolContext): Promise<ToolExecutionResult>;
}
//# sourceMappingURL=inspect-project.d.ts.map