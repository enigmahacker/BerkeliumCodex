export declare class SecurityPathError extends Error {
    readonly attemptedPath: string;
    constructor(message: string, attemptedPath: string);
}
/**
 * Resolves any path (existing or hypothetical) to its canonical representation
 * by resolving symlinks on the closest existing ancestor directory and recombining.
 */
export declare function canonicalizePath(targetPath: string): string;
/**
 * Resolves a user-provided path against workspaceRoot and verifies:
 * 1. Path is strictly within the workspace root boundary (no ../ traversal escape, no prefix mismatch).
 * 2. Canonical realpath of existing file/directory is within workspace root (no symlink escape).
 * 3. Nearest existing ancestor directory is within workspace root for newly created paths.
 */
export declare function resolveSafeWorkspacePath(workspaceRoot: string, targetPath: string): string;
//# sourceMappingURL=path-utils.d.ts.map