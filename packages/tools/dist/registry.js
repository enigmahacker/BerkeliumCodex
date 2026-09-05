export class ToolRegistry {
    tools = new Map();
    register(tool) {
        this.tools.set(tool.metadata.name, tool);
    }
    registerMany(tools) {
        for (const tool of tools) {
            this.register(tool);
        }
    }
    get(name) {
        return this.tools.get(name);
    }
    has(name) {
        return this.tools.has(name);
    }
    list() {
        return Array.from(this.tools.values());
    }
    getDefinitions() {
        const definitions = [];
        for (const tool of this.tools.values()) {
            definitions.push({
                name: tool.metadata.name,
                description: tool.metadata.description,
                parameters: this.zodToJsonSchema(tool.schema),
            });
        }
        return definitions;
    }
    zodToJsonSchema(schema) {
        // Lightweight JSON Schema extraction from Zod object definition
        try {
            const def = schema._def;
            if (def && def.typeName === 'ZodObject') {
                const shape = def.shape();
                const properties = {};
                const required = [];
                for (const [key, propSchema] of Object.entries(shape)) {
                    const propDef = propSchema._def;
                    const isOptional = propDef.typeName === 'ZodOptional' || propDef.typeName === 'ZodDefault';
                    const innerDef = isOptional && propDef.innerType ? propDef.innerType._def : propDef;
                    let type = 'string';
                    if (innerDef.typeName === 'ZodNumber')
                        type = 'number';
                    if (innerDef.typeName === 'ZodBoolean')
                        type = 'boolean';
                    if (innerDef.typeName === 'ZodArray')
                        type = 'array';
                    if (innerDef.typeName === 'ZodObject')
                        type = 'object';
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
        }
        catch { }
        return { type: 'object', properties: {} };
    }
}
//# sourceMappingURL=registry.js.map