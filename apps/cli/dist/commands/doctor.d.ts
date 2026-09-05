import { ThemeManager } from '@berkelium/themes';
import { AuthStore } from '@berkelium/auth';
import { ProviderRouter } from '@berkelium/providers';
export interface DiagnosticCheckItem {
    name: string;
    passed: boolean;
    message?: string;
    category: 'Platform' | 'Runtime' | 'Providers' | 'Tools';
}
export interface DoctorReport {
    timestamp: string;
    passed: boolean;
    platform: {
        os: string;
        arch: string;
        isAppleSilicon: boolean;
        nodeVersion: string;
    };
    checks: DiagnosticCheckItem[];
}
export declare class DoctorCommand {
    static run(themeManager: ThemeManager, authStore: AuthStore, router: ProviderRouter, json?: boolean): Promise<void>;
}
//# sourceMappingURL=doctor.d.ts.map