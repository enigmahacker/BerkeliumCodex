import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
export class CheckpointManager {
    workspaceRoot;
    checkpointsDir;
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this.checkpointsDir = path.join(workspaceRoot, '.berkelium', 'checkpoints');
    }
    createCheckpoint(name) {
        if (!fs.existsSync(this.checkpointsDir)) {
            fs.mkdirSync(this.checkpointsDir, { recursive: true });
        }
        const cleanName = (name || 'snapshot').replace(/[^a-zA-Z0-9_-]/g, '_');
        const id = `cp_${Date.now()}_${cleanName}`;
        let commit = 'no_git';
        let modifiedFiles = [];
        let untrackedFiles = [];
        let hasDiff = false;
        let patchPath;
        try {
            commit = execSync('git rev-parse HEAD', { cwd: this.workspaceRoot, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
            const diff = execSync('git diff HEAD', { cwd: this.workspaceRoot, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
            if (diff.trim()) {
                hasDiff = true;
                patchPath = path.join(this.checkpointsDir, `${id}.patch`);
                fs.writeFileSync(patchPath, diff, 'utf-8');
            }
            const statusOutput = execSync('git status --porcelain', { cwd: this.workspaceRoot, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
            for (const line of statusOutput.split('\n').filter(Boolean)) {
                const filePath = line.slice(3).trim();
                if (line.startsWith('??')) {
                    untrackedFiles.push(filePath);
                }
                else {
                    modifiedFiles.push(filePath);
                }
            }
        }
        catch {
            // Non-git or git error
        }
        const record = {
            id,
            name: name || 'Automatic snapshot',
            timestamp: Date.now(),
            commit,
            hasDiff,
            modifiedFiles,
            untrackedFiles,
            patchPath,
        };
        const recordPath = path.join(this.checkpointsDir, `${id}.json`);
        fs.writeFileSync(recordPath, JSON.stringify(record, null, 2), 'utf-8');
        return record;
    }
    listCheckpoints() {
        if (!fs.existsSync(this.checkpointsDir)) {
            return [];
        }
        const results = [];
        try {
            const files = fs.readdirSync(this.checkpointsDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const data = JSON.parse(fs.readFileSync(path.join(this.checkpointsDir, file), 'utf-8'));
                        results.push(data);
                    }
                    catch {
                        // Ignore parse errors
                    }
                }
            }
        }
        catch {
            // Ignore
        }
        return results.sort((a, b) => b.timestamp - a.timestamp);
    }
    restoreCheckpoint(id) {
        const recordPath = path.join(this.checkpointsDir, `${id}.json`);
        if (!fs.existsSync(recordPath)) {
            return { success: false, message: `Checkpoint not found: ${id}` };
        }
        let record;
        try {
            record = JSON.parse(fs.readFileSync(recordPath, 'utf-8'));
        }
        catch (err) {
            return { success: false, message: `Failed to read checkpoint record: ${err.message}` };
        }
        // First create a safety backup before restoring
        this.createCheckpoint(`safety_before_restore_${id}`);
        try {
            // Revert tracked working changes
            execSync('git checkout -- .', { cwd: this.workspaceRoot, stdio: ['ignore', 'pipe', 'ignore'] });
            // Apply patch if available
            if (record.patchPath && fs.existsSync(record.patchPath)) {
                execSync(`git apply "${record.patchPath}"`, { cwd: this.workspaceRoot, stdio: ['ignore', 'pipe', 'ignore'] });
            }
            return {
                success: true,
                message: `Successfully restored checkpoint ${id} (${record.name})`,
            };
        }
        catch (err) {
            return {
                success: false,
                message: `Error restoring checkpoint: ${err.message}`,
            };
        }
    }
    undo() {
        const list = this.listCheckpoints().filter(c => !c.name.startsWith('safety_before_restore_'));
        if (list.length === 0) {
            return { success: false, message: 'No checkpoints available to undo' };
        }
        return this.restoreCheckpoint(list[0].id);
    }
    formatCheckpoints() {
        const list = this.listCheckpoints();
        if (list.length === 0) {
            return 'No checkpoints found in .berkelium/checkpoints/';
        }
        const lines = [
            `CHECKPOINTS (${list.length} saved):`,
            `────────────────────────────────────────────────────────────`,
        ];
        for (const cp of list.slice(0, 10)) {
            const dateStr = new Date(cp.timestamp).toISOString().replace('T', ' ').slice(0, 19);
            const modCount = cp.modifiedFiles.length;
            lines.push(`• ${cp.id.padEnd(28)} ${dateStr}  ${cp.name}` +
                (modCount > 0 ? ` (${modCount} files modified)` : ' (clean)'));
        }
        return lines.join('\n');
    }
}
//# sourceMappingURL=checkpoint-manager.js.map