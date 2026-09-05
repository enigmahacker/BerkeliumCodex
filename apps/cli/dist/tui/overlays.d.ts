import { ThemeManager } from '@berkelium/themes';
import { PermissionPolicy, BerkeliumConfig, PromptLayers } from '@berkelium/config';
import { ContextBreakdown } from '@berkelium/context';
import { ModelInfo } from '@berkelium/providers';
import { AuthStatus } from '@berkelium/auth';
import { SessionStats } from '@berkelium/telemetry';
export declare class TUIOverlays {
    static renderAuth(themeManager: ThemeManager, statuses: AuthStatus[]): void;
    static renderSystemPrompt(themeManager: ThemeManager, layers: PromptLayers, workspaceRoot: string): void;
    static renderPermissions(themeManager: ThemeManager, policy: PermissionPolicy): void;
    static renderContext(themeManager: ThemeManager, bd: ContextBreakdown): void;
    static renderTokens(themeManager: ThemeManager, stats: SessionStats, bd: ContextBreakdown): void;
    static renderModels(themeManager: ThemeManager, aliases: Record<string, any>, discovered: Record<string, ModelInfo[]>): void;
    static renderThemes(themeManager: ThemeManager): void;
    static renderConfig(themeManager: ThemeManager, config: BerkeliumConfig): void;
    static renderSecurity(themeManager: ThemeManager, workspaceRoot: string, policy: PermissionPolicy): void;
    static renderSecurityAudit(themeManager: ThemeManager, workspaceRoot: string): void;
}
//# sourceMappingURL=overlays.d.ts.map