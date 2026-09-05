import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export declare const DiagnosticsInputSchema: z.ZodObject<{
    path: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    path?: string | undefined;
}, {
    path?: string | undefined;
}>;
export type DiagnosticsInput = z.infer<typeof DiagnosticsInputSchema>;
export declare class DiagnosticsTool implements Tool<DiagnosticsInput> {
    readonly metadata: {
        name: string;
        description: string;
        category: "diagnostics";
        risk: "low";
    };
    readonly schema: z.ZodObject<{
        path: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path?: string | undefined;
    }, {
        path?: string | undefined;
    }>;
    execute(args: DiagnosticsInput, context: ToolContext): Promise<ToolExecutionResult>;
}
//# sourceMappingURL=diagnostics.d.ts.map