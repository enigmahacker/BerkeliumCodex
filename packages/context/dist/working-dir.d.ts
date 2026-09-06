export interface ProjectInfo {
    language: string;
    framework: string;
    packageManager?: string;
    hasGit: boolean;
    gitBranch?: string;
    gitRoot?: string;
}
export interface DirectoryEntry {
    name: string;
    type: 'file' | 'directory' | 'symlink' | 'other';
    sizeBytes: number;
    modifiedAt: Date;
    isExecutable: boolean;
}
export interface CdResult {
    success: boolean;
    previousDir: string;
    newDir: string;
    project: ProjectInfo;
    message: string;
    error?: string;
}
export declare class WorkingDirectoryManager {
    private static instance;
    private currentDir;
    private changeListeners;
    constructor(initialDir?: string);
    static getInstance(initialDir?: string): WorkingDirectoryManager;
    getCwd(): string;
    getRelativeHome(): string;
    getProjectInfo(): ProjectInfo;
    onDirectoryChange(callback: (newDir: string, project: ProjectInfo) => void): () => void;
    changeDirectory(targetPath: string): CdResult;
    listDirectory(dirPath?: string): DirectoryEntry[];
    formatStatus(): string;
    private resolvePath;
    private detectProject;
}
//# sourceMappingURL=working-dir.d.ts.map