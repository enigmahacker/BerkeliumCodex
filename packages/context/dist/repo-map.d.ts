import { FileMetadata } from './types.js';
export declare class RepoMapper {
    private workspaceRoot;
    private fileCache;
    constructor(workspaceRoot?: string);
    scan(maxFiles?: number): Promise<FileMetadata[]>;
    generateRepoMap(maxTokens?: number): Promise<string>;
    private walk;
    private isCodeFile;
    private extractFileMetadata;
}
//# sourceMappingURL=repo-map.d.ts.map