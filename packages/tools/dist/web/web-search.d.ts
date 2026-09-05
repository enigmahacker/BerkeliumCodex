import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export declare const WebSearchInputSchema: z.ZodObject<{
    query: z.ZodString;
}, "strip", z.ZodTypeAny, {
    query: string;
}, {
    query: string;
}>;
export type WebSearchInput = z.infer<typeof WebSearchInputSchema>;
export declare class WebSearchTool implements Tool<WebSearchInput> {
    readonly metadata: {
        name: string;
        description: string;
        category: "web";
        risk: "low";
        network: boolean;
    };
    readonly schema: z.ZodObject<{
        query: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        query: string;
    }, {
        query: string;
    }>;
    execute(args: WebSearchInput, _context: ToolContext): Promise<ToolExecutionResult>;
}
//# sourceMappingURL=web-search.d.ts.map