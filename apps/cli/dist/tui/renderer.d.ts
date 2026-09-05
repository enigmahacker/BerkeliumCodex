import { ThemeManager } from '@berkelium/themes';
import { AgentEvent } from '@berkelium/events';
export interface TelemetryViewProps {
    model: string;
    provider: string;
    contextUsed: number;
    contextLimit: number;
    totalTokens: number;
    latencySeconds: number;
    hackathonMode?: boolean;
}
export declare class TUIRenderer {
    private themeManager;
    private currentStreamLine;
    private isInReasoning;
    private hasActiveStream;
    constructor(themeManager: ThemeManager);
    renderHeader(model: string, provider: string, workspace: string): void;
    renderPromptSymbol(): string;
    flushStream(): void;
    handleEvent(event: AgentEvent): void;
    renderTelemetryBar(props: TelemetryViewProps): void;
}
//# sourceMappingURL=renderer.d.ts.map