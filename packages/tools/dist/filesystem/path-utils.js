import * as path from 'node:path';
import * as fs from 'node:fs';
export class SecurityPathError extends Error {
    attemptedPath;
    constructor(message, attemptedPath) {
        super(message);
        this.attemptedPath = attemptedPath;
        this.name = 'SecurityPathError';
    }
}
/**
 * Resolves any path (existing or hypothetical) to its canonical representation
 * by resolving symlinks on the closest existing ancestor directory and recombining.
 */
export function canonicalizePath(targetPath) {
    const resolved = path.resolve(targetPath);
    try {
        if (fs.existsSync(resolved)) {
            return fs.realpathSync(resolved);
        }
        let curr = resolved;
        const parts = [];
        while (curr && curr !== path.dirname(curr)) {
            if (fs.existsSync(curr)) {
                const canonicalAncestor = fs.realpathSync(curr);
                return path.resolve(canonicalAncestor, ...parts.reverse());
            }
            parts.push(path.basename(curr));
            curr = path.dirname(curr);
        }
        return resolved;
    }
    catch {
        return resolved;
    }
}
/**
 * Resolves a user-provided path against workspaceRoot and verifies:
 * 1. Path is strictly within the workspace root boundary (no ../ traversal escape, no prefix mismatch).
 * 2. Canonical realpath of existing file/directory is within workspace root (no symlink escape).
 * 3. Nearest existing ancestor directory is within workspace root for newly created paths.
 */
export function resolveSafeWorkspacePath(workspaceRoot, targetPath) {
    if (!targetPath || typeof targetPath !== 'string') {
        throw new SecurityPathError('Invalid path: path must be a non-empty string', targetPath);
    }
    // Reject null-byte injection
    if (targetPath.includes('\0')) {
        throw new SecurityPathError('Null-byte injection detected in path', targetPath);
    }
    const canonicalRoot = canonicalizePath(workspaceRoot);
    const resolvedTarget = path.resolve(canonicalRoot, targetPath);
    // If path exists on disk, resolve its realpath to catch symlinks pointing outside
    if (fs.existsSync(resolvedTarget)) {
        try {
            const canonicalTarget = fs.realpathSync(resolvedTarget);
            const isInside = canonicalTarget === canonicalRoot ||
                canonicalTarget.startsWith(canonicalRoot + path.sep);
            if (!isInside) {
                throw new SecurityPathError(`Symlink escape blocked: "${targetPath}" links to "${canonicalTarget}" outside authorized workspace root "${canonicalRoot}"`, targetPath);
            }
            return canonicalTarget;
        }
        catch (err) {
            if (err instanceof SecurityPathError)
                throw err;
        }
    }
    // If path does not exist yet (e.g. creating new file), canonicalize through ancestor
    const canonicalTarget = canonicalizePath(resolvedTarget);
    const isInside = canonicalTarget === canonicalRoot ||
        canonicalTarget.startsWith(canonicalRoot + path.sep);
    if (!isInside) {
        throw new SecurityPathError(`Path traversal blocked: "${targetPath}" resolves outside authorized workspace root "${canonicalRoot}"`, targetPath);
    }
    return canonicalTarget;
}
//# sourceMappingURL=path-utils.js.map