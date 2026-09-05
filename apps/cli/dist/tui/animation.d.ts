import { ThemeManager } from '@berkelium/themes';
export interface LaunchAnimationOptions {
    durationMs?: number;
    skip?: boolean;
    matrix?: boolean;
    model?: string;
    provider?: string;
    workspace?: string;
    toolCount?: number;
}
export declare class LaunchAnimation {
    static play(themeManager: ThemeManager, options?: LaunchAnimationOptions): Promise<void>;
}
//# sourceMappingURL=animation.d.ts.map