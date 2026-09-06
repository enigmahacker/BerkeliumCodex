import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

export interface CheckpointRecord {
  id: string;
  name: string;
  timestamp: number;
  commit: string;
  hasDiff: boolean;
  modifiedFiles: string[];
  untrackedFiles: string[];
  patchPath?: string;
}

export class CheckpointManager {
  private workspaceRoot: string;
  private checkpointsDir: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.checkpointsDir = path.join(workspaceRoot, '.berkelium', 'checkpoints');
  }

  public createCheckpoint(name?: string): CheckpointRecord {
    if (!fs.existsSync(this.checkpointsDir)) {
      fs.mkdirSync(this.checkpointsDir, { recursive: true });
    }

    const cleanName = (name || 'snapshot').replace(/[^a-zA-Z0-9_-]/g, '_');
    const id = `cp_${Date.now()}_${cleanName}`;
    let commit = 'no_git';
    let modifiedFiles: string[] = [];
    let untrackedFiles: string[] = [];
    let hasDiff = false;
    let patchPath: string | undefined;

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
        } else {
          modifiedFiles.push(filePath);
        }
      }
    } catch {
      // Non-git or git error
    }

    const record: CheckpointRecord = {
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

  public listCheckpoints(): CheckpointRecord[] {
    if (!fs.existsSync(this.checkpointsDir)) {
      return [];
    }

    const results: CheckpointRecord[] = [];
    try {
      const files = fs.readdirSync(this.checkpointsDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const data = JSON.parse(fs.readFileSync(path.join(this.checkpointsDir, file), 'utf-8'));
            results.push(data);
          } catch {
            // Ignore parse errors
          }
        }
      }
    } catch {
      // Ignore
    }

    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  public restoreCheckpoint(id: string): { success: boolean; message: string } {
    const recordPath = path.join(this.checkpointsDir, `${id}.json`);
    if (!fs.existsSync(recordPath)) {
      return { success: false, message: `Checkpoint not found: ${id}` };
    }

    let record: CheckpointRecord;
    try {
      record = JSON.parse(fs.readFileSync(recordPath, 'utf-8'));
    } catch (err: any) {
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
    } catch (err: any) {
      return {
        success: false,
        message: `Error restoring checkpoint: ${err.message}`,
      };
    }
  }

  public undo(): { success: boolean; message: string } {
    const list = this.listCheckpoints().filter(c => !c.name.startsWith('safety_before_restore_'));
    if (list.length === 0) {
      return { success: false, message: 'No checkpoints available to undo' };
    }
    return this.restoreCheckpoint(list[0].id);
  }

  public formatCheckpoints(): string {
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
      lines.push(
        `• ${cp.id.padEnd(28)} ${dateStr}  ${cp.name}` +
        (modCount > 0 ? ` (${modCount} files modified)` : ' (clean)')
      );
    }

    return lines.join('\n');
  }
}
