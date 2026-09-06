export type AgentMode = 'ask' | 'plan' | 'build' | 'debug' | 'review' | 'test' | 'refactor';
export interface ModeConfig {
    name: AgentMode;
    description: string;
    isDestructiveAllowed: boolean;
    promptInstructions: string;
}
export declare const AGENT_MODES: Record<AgentMode, ModeConfig>;
export declare function isValidAgentMode(mode: string): mode is AgentMode;
//# sourceMappingURL=modes.d.ts.map