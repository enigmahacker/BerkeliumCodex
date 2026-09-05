import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export declare const RunShellInputSchema: z.ZodObject<{
    command: z.ZodString;
    cwd: z.ZodOptional<z.ZodString>;
    timeout_ms: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    command: string;
    timeout_ms: number;
    cwd?: string | undefined;
}, {
    command: string;
    cwd?: string | undefined;
    timeout_ms?: number | undefined;
}>;
export type RunShellInput = z.infer<typeof RunShellInputSchema>;
export declare class RunShellTool implements Tool<RunShellInput> {
    readonly metadata: {
        name: string;
        description: string;
        category: "shell";
        risk: "medium";
        requiresConfirmation: boolean;
    };
    readonly schema: z.ZodObject<{
        command: z.ZodString;
        cwd: z.ZodOptional<z.ZodString>;
        timeout_ms: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        command: string;
        timeout_ms: number;
        cwd?: string | undefined;
    }, {
        command: string;
        cwd?: string | undefined;
        timeout_ms?: number | undefined;
    }>;
    execute(args: RunShellInput, context: ToolContext): Promise<ToolExecutionResult>;
}
//# sourceMappingURL=run-shell.d.ts.map