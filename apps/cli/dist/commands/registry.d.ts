import { CommandDefinition, CommandCategory } from './types.js';
export declare class CommandRegistry {
    private static instance;
    private commands;
    private aliasMap;
    constructor();
    static getInstance(): CommandRegistry;
    register(def: CommandDefinition): void;
    unregister(name: string): boolean;
    get(nameOrAlias: string): CommandDefinition | undefined;
    list(): CommandDefinition[];
    listByCategory(category?: CommandCategory): CommandDefinition[];
    getCategories(): CommandCategory[];
    loadCustomCommands(workspaceRoot: string): void;
    registerPluginCommand(pluginName: string, def: CommandDefinition): void;
    private registerBuiltIns;
}
//# sourceMappingURL=registry.d.ts.map