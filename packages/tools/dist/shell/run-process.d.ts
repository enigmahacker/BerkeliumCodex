import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export declare const RunProcessInputSchema: z.ZodObject<{
    executable: z.ZodString;
    args: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    cwd: z.ZodOptional<z.ZodString>;
    timeout_ms: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    timeout_ms: number;
    executable: string;
    args: string[];
    cwd?: string | undefined;
}, {
    executable: string;
    cwd?: string | undefined;
    timeout_ms?: number | undefined;
    args?: string[] | undefined;
}>;
export type RunProcessInput = z.infer<typeof RunProcessInputSchema>;
export declare class RunProcessTool implements Tool<RunProcessInput> {
    readonly metadata: {
        name: string;
        description: string;
        category: "shell";
        risk: "medium";
    };
    readonly schema: z.ZodObject<{
        executable: z.ZodString;
        args: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        cwd: z.ZodOptional<z.ZodString>;
        timeout_ms: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        timeout_ms: number;
        executable: string;
        args: string[];
        cwd?: string | undefined;
    }, {
        executable: string;
        cwd?: string | undefined;
        timeout_ms?: number | undefined;
        args?: string[] | undefined;
    }>;
    execute(args: RunProcessInput, context: ToolContext): Promise<ToolExecutionResult>;
}
//# sourceMappingURL=run-process.d.ts.map