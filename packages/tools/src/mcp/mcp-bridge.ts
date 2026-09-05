import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>, context: ToolContext) => Promise<any>;
}

export class MCPBridgeTool implements Tool<Record<string, unknown>> {
  public readonly metadata: Tool['metadata'];
  public readonly schema: z.ZodSchema<Record<string, unknown>>;
  private mcpDef: MCPToolDefinition;

  constructor(mcpDef: MCPToolDefinition) {
    this.mcpDef = mcpDef;
    this.metadata = {
      name: `mcp_${mcpDef.name}`,
      description: mcpDef.description || `MCP Tool: ${mcpDef.name}`,
      category: 'mcp',
      risk: 'medium',
      requiresConfirmation: true,
    };
    this.schema = z.record(z.unknown());
  }

  public async execute(
    args: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolExecutionResult> {
    try {
      const res = await this.mcpDef.handler(args, context);
      const text = typeof res === 'string' ? res : JSON.stringify(res, null, 2);
      return {
        success: true,
        output: text,
        data: res,
      };
    } catch (err: any) {
      return {
        success: false,
        output: `MCP Tool "${this.metadata.name}" failed: ${err.message}`,
        error: err.message,
      };
    }
  }
}
