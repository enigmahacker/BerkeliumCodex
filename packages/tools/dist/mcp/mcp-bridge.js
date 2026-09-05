import { z } from 'zod';
export class MCPBridgeTool {
    metadata;
    schema;
    mcpDef;
    constructor(mcpDef) {
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
    async execute(args, context) {
        try {
            const res = await this.mcpDef.handler(args, context);
            const text = typeof res === 'string' ? res : JSON.stringify(res, null, 2);
            return {
                success: true,
                output: text,
                data: res,
            };
        }
        catch (err) {
            return {
                success: false,
                output: `MCP Tool "${this.metadata.name}" failed: ${err.message}`,
                error: err.message,
            };
        }
    }
}
//# sourceMappingURL=mcp-bridge.js.map