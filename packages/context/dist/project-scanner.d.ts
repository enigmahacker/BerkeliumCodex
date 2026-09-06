export interface ProjectScanResult {
    repositoryName: string;
    language: string;
    framework: string;
    totalFiles: number;
    sourceFiles: number;
    testFiles: number;
    configFiles: number;
    documentationFiles: number;
    packagesCount: number;
    circularDependenciesCount: number;
    circularDependencies: string[][];
    git: {
        hasGit: boolean;
        branch?: string;
        modifiedCount: number;
        untrackedCount: number;
    };
    buildStatus: 'PASS' | 'FAIL' | 'UNKNOWN';
    testsSummary: string;
    securityWarningsCount: number;
}
export declare class ProjectScanner {
    private static ignoredDirs;
    static scan(workspaceRoot: string, mode?: 'project' | 'deep' | 'dependencies' | 'git' | 'tests'): ProjectScanResult;
    static formatReport(result: ProjectScanResult): string;
    private static detectCircularDependencies;
}
//# sourceMappingURL=project-scanner.d.ts.map