import { ThemeManager } from '@berkelium/themes';
import { ConfigManager } from '@berkelium/config';
import { SessionManager } from '@berkelium/agent';
export declare class SessionCommand {
    static run(themeManager: ThemeManager, configManager: ConfigManager, subaction?: string, targetSessionId?: string, sessionManager?: SessionManager): Promise<void>;
}
//# sourceMappingURL=session-cmd.d.ts.map