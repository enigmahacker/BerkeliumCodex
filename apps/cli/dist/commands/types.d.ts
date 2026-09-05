import { AgentRuntime } from '@berkelium/agent';
import { ThemeManager } from '@berkelium/themes';
import { ConfigManager } from '@berkelium/config';
import { ProviderRouter } from '@berkelium/providers';
import { ToolOrchestrator } from '@berkelium/tools';
import { ContextEngine } from '@berkelium/context';
import { AuthStore } from '@berkelium/auth';
export type CommandCategory = 'GENERAL' | 'MODEL' | 'PROVIDERS' | 'CONTEXT' | 'TOOLS' | 'AGENTS' | 'CONFIGURATION' | 'PERMISSIONS' | 'THEMES' | 'GIT' | 'SESSION' | 'DEVELOPMENT' | 'SYSTEM' | 'CUSTOM';
export interface CommandArgument {
    name: string;
    description: string;
    required: boolean;
    dynamicProvider?: 'model' | 'provider' | 'theme' | 'agent' | 'tool' | 'session' | 'system-layer';
    staticOptions?: string[];
}
export interface CommandExecutionContext {
    runtime: AgentRuntime;
    themeManager: ThemeManager;
    configManager: ConfigManager;
    router: ProviderRouter;
    orchestrator: ToolOrchestrator;
    contextEngine: ContextEngine;
    authStore: AuthStore;
}
export interface CommandDefinition {
    name: string;
    aliases?: string[];
    description: string;
    category: CommandCategory;
    usage?: string;
    examples?: string[];
    arguments?: CommandArgument[];
    requiresConfirmation?: boolean;
    handler?: (context: CommandExecutionContext, args: string[], rawInput: string) => Promise<boolean | void>;
    isCustom?: boolean;
    customPromptTemplate?: string;
}
export interface CommandMatchResult {
    command: CommandDefinition;
    score: number;
    matchedIndices: number[];
}
export interface ArgumentMatchResult {
    value: string;
    description?: string;
    score: number;
    matchedIndices: number[];
}
//# sourceMappingURL=types.d.ts.map