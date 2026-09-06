export interface SecurityFinding {
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    category: 'SECRET_LEAK' | 'SENSITIVE_FILE' | 'DANGEROUS_SCRIPT' | 'INSECURE_CONFIG' | 'GIT_HISTORY_LEAK';
    file: string;
    line?: number;
    description: string;
    matchedPattern?: string;
}
export interface SecurityScanResult {
    workspaceRoot: string;
    filesScanned: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    findings: SecurityFinding[];
    durationMs: number;
    disclaimer: string;
}
export declare class SecurityScanner {
    private static ignoredDirs;
    private static secretPatterns;
    private static sensitiveFileNames;
    static scan(workspaceRoot: string): SecurityScanResult;
    static formatReport(result: SecurityScanResult): string;
}
//# sourceMappingURL=security-scanner.d.ts.map