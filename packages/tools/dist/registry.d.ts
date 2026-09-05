import { Tool } from './types.js';
export declare class ToolRegistry {
    private tools;
    register(tool: Tool): void;
    registerMany(tools: Tool[]): void;
    get(name: string): Tool | undefined;
    has(name: string): boolean;
    list(): Tool[];
    getDefinitions(): Array<{
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    }>;
    private zodToJsonSchema;
}
//# sourceMappingURL=registry.d.ts.map