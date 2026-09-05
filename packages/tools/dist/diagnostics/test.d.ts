import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export declare const TestInputSchema: z.ZodObject<{
    filter: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    filter?: string | undefined;
}, {
    filter?: string | undefined;
}>;
export type TestInput = z.infer<typeof TestInputSchema>;
export declare class TestTool implements Tool<TestInput> {
    readonly metadata: {
        name: string;
        description: string;
        category: "diagnostics";
        risk: "low";
    };
    readonly schema: z.ZodObject<{
        filter: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        filter?: string | undefined;
    }, {
        filter?: string | undefined;
    }>;
    execute(args: TestInput, context: ToolContext): Promise<ToolExecutionResult>;
}
//# sourceMappingURL=test.d.ts.map