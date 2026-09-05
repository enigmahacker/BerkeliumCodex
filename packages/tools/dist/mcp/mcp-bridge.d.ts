import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';
export interface MCPToolDefinition {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    handler: (args: Record<string, unknown>, context: ToolContext) => Promise<any>;
}
export declare class MCPBridgeTool implements Tool<Record<string, unknown>> {
    readonly metadata: Tool['metadata'];
    readonly schema: z.ZodSchema<Record<string, unknown>>;
    private mcpDef;
    constructor(mcpDef: MCPToolDefinition);
    execute(args: Record<string, unknown>, context: ToolContext): Promise<ToolExecutionResult>;
}
//# sourceMappingURL=mcp-bridge.d.ts.map