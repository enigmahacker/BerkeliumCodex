import { ThemeManager } from '@berkelium/themes';
export declare class GitCommand {
    private static DESTRUCTIVE_PATTERNS;
    static isDestructive(cmd: string): boolean;
    static run(themeManager: ThemeManager, subaction?: string, extraArgs?: string[], workspaceRoot?: string): Promise<void>;
}
//# sourceMappingURL=git-cmd.d.ts.map