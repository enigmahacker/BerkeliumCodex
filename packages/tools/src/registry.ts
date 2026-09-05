import { Tool, ToolMetadata } from './types.js';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  public register(tool: Tool): void {
    this.tools.set(tool.metadata.name, tool);
  }

  public registerMany(tools: Tool[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  public get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  public has(name: string): boolean {
    return this.tools.has(name);
  }

  public list(): Tool[] {
    return Array.from(this.tools.values());
  }

  public getDefinitions(): Array<{ name: string; description: string; parameters: Record<string, unknown> }> {
    const definitions: Array<{ name: string; description: string; parameters: Record<string, unknown> }> = [];
    for (const tool of this.tools.values()) {
      definitions.push({
        name: tool.metadata.name,
        description: tool.metadata.description,
        parameters: this.zodToJsonSchema(tool.schema),
      });
    }
    return definitions;
  }

  private zodToJsonSchema(schema: any): Record<string, unknown> {
    // Lightweight JSON Schema extraction from Zod object definition
    try {
      const def = schema._def;
      if (def && def.typeName === 'ZodObject') {
        const shape = def.shape();
        const properties: Record<string, any> = {};
        const required: string[] = [];

        for (const [key, propSchema] of Object.entries(shape as Record<string, any>)) {
          const propDef = propSchema._def;
          const isOptional = propDef.typeName === 'ZodOptional' || propDef.typeName === 'ZodDefault';
          const innerDef = isOptional && propDef.innerType ? propDef.innerType._def : propDef;

          let type = 'string';
          if (innerDef.typeName === 'ZodNumber') type = 'number';
          if (innerDef.typeName === 'ZodBoolean') type = 'boolean';
          if (innerDef.typeName === 'ZodArray') type = 'array';
          if (innerDef.typeName === 'ZodObject') type = 'object';

          properties[key] = {
            type,
            description: propSchema.description || undefined,
          };

          if (!isOptional) {
            required.push(key);
          }
        }

        return {
          type: 'object',
          properties,
          required: required.length > 0 ? required : undefined,
        };
      }
    } catch {}

    return { type: 'object', properties: {} };
  }
}
