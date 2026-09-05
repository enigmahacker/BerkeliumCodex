import { AgentRuntime } from '@berkelium/agent';
import { ThemeManager } from '@berkelium/themes';
import { ConfigManager } from '@berkelium/config';
import { ProviderRouter } from '@berkelium/providers';
import { ToolOrchestrator } from '@berkelium/tools';
import { ContextEngine } from '@berkelium/context';
import { AuthStore } from '@berkelium/auth';
export declare class SlashCommandHandler {
    private runtime;
    private themeManager;
    private configManager;
    private router;
    private orchestrator;
    private contextEngine;
    private authStore;
    private registry;
    constructor(runtime: AgentRuntime, themeManager: ThemeManager, configManager: ConfigManager, router: ProviderRouter, orchestrator: ToolOrchestrator, contextEngine: ContextEngine, authStore: AuthStore);
    isSlashCommand(input: string): boolean;
    getCompletions(line: string): string[];
    renderQuickOptions(prefix?: string): void;
    renderCommandHelp(commandName: string): void;
    handle(input: string): Promise<boolean>;
}
//# sourceMappingURL=slash-commands.d.ts.map