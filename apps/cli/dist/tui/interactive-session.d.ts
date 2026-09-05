import { AgentRuntime } from '@berkelium/agent';
import { ThemeManager } from '@berkelium/themes';
import { EventBus } from '@berkelium/events';
import { ConfigManager } from '@berkelium/config';
import { ProviderRouter } from '@berkelium/providers';
import { ToolOrchestrator } from '@berkelium/tools';
import { ContextEngine } from '@berkelium/context';
import { AuthStore } from '@berkelium/auth';
export interface InteractiveSessionOptions {
    runtime: AgentRuntime;
    themeManager: ThemeManager;
    eventBus: EventBus;
    configManager: ConfigManager;
    router: ProviderRouter;
    orchestrator: ToolOrchestrator;
    contextEngine: ContextEngine;
    authStore: AuthStore;
    hackathonMode?: boolean;
}
export declare class InteractiveSession {
    private runtime;
    private themeManager;
    private renderer;
    private slashHandler;
    private configManager;
    private router;
    private orchestrator;
    private contextEngine;
    private authStore;
    private hackathonMode;
    private rl;
    private isProcessing;
    private ctrlCCount;
    private inputStateMachine;
    private paletteRenderer;
    constructor(options: InteractiveSessionOptions);
    start(): Promise<void>;
    private setupKeybindings;
    private processInputLine;
    private detectApiKeyProvider;
    private formatAsSlashCommand;
    private promptUser;
}
//# sourceMappingURL=interactive-session.d.ts.map