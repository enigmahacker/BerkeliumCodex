import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export declare const FetchUrlInputSchema: z.ZodObject<{
    url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url: string;
}, {
    url: string;
}>;
export type FetchUrlInput = z.infer<typeof FetchUrlInputSchema>;
export declare class FetchUrlTool implements Tool<FetchUrlInput> {
    readonly metadata: {
        name: string;
        description: string;
        category: "web";
        risk: "medium";
        network: boolean;
    };
    readonly schema: z.ZodObject<{
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
    }, {
        url: string;
    }>;
    execute(args: FetchUrlInput, _context: ToolContext): Promise<ToolExecutionResult>;
}
//# sourceMappingURL=fetch-url.d.ts.map