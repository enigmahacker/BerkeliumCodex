import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { z } from 'zod';
import { Tool, ToolContext, ToolExecutionResult } from '../types.js';

export interface CheckpointRecord {
  id: string;
  name: string;
  timestamp: number;
  commit: string;
  hasDiff: boolean;
  modifiedFiles: string[];
  untrackedFiles: string[];
  patchPath?: string;
  /** False when the workspace could not capture a Git snapshot that can be restored. */
  restorable: boolean;
  reason?: string;
}

const AUTO_CHECKPOINT_PREFIX = 'auto_before_task';
const AUTO_CHECKPOINT_RETENTION = 20;

export class CheckpointManager {
  private workspaceRoot: string;
  private checkpointsDir: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.checkpointsDir = path.join(workspaceRoot, '.berkelium', 'checkpoints');
  }

  public isGitRepository(): boolean {
    try {
      const result = execFileSync('git', ['rev-parse', '--is-inside-work-tree'], {
        cwd: this.workspaceRoot,
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .toString()
        .trim();
      return result === 'true';
    } catch {
      return false;
    }
  }

  private ensureCheckpointDir(): void {
    if (!fs.existsSync(this.checkpointsDir)) {
      fs.mkdirSync(this.checkpointsDir, { recursive: true });
    }
    // Keep snapshots out of `git status` and agent-visible diffs without
    // requiring the user to edit their repository's .gitignore.
    const gitignorePath = path.join(this.checkpointsDir, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, '*\n', 'utf-8');
    }
  }

  private pruneAutoCheckpoints(): void {
    const autoCheckpoints = this.listCheckpoints().filter((checkpoint) =>
      checkpoint.name.startsWith(AUTO_CHECKPOINT_PREFIX)
    );
    for (const checkpoint of autoCheckpoints.slice(AUTO_CHECKPOINT_RETENTION)) {
      this.removeCheckpointFiles(checkpoint);
    }
  }

  private removeCheckpointFiles(record: CheckpointRecord): void {
    try {
      fs.unlinkSync(path.join(this.checkpointsDir, `${record.id}.json`));
    } catch {
      // Best-effort cleanup.
    }
    if (record.patchPath) {
      try {
        fs.unlinkSync(record.patchPath);
      } catch {
        // Best-effort cleanup.
      }
    }
  }

  public createCheckpoint(name?: string): CheckpointRecord {
    this.ensureCheckpointDir();

    const cleanName = (name || 'snapshot').replace(/[^a-zA-Z0-9_-]/g, '_');
    const id = `cp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}_${cleanName}`;
    let commit = 'no_git';
    let modifiedFiles: string[] = [];
    let untrackedFiles: string[] = [];
    let hasDiff = false;
    let patchPath: string | undefined;
    let restorable = false;
    let reason: string | undefined;

    if (!this.isGitRepository()) {
      reason = 'This workspace is not a Git repository, so no restorable snapshot was captured.';
    } else {
      try {
        commit = execFileSync('git', ['rev-parse', '--verify', 'HEAD'], {
          cwd: this.workspaceRoot,
          stdio: ['ignore', 'pipe', 'ignore'],
        }).toString().trim();
        restorable = true;

        const diff = execFileSync('git', ['diff', 'HEAD'], {
          cwd: this.workspaceRoot,
          stdio: ['ignore', 'pipe', 'ignore'],
        }).toString();
        if (diff.trim()) {
          hasDiff = true;
          patchPath = path.join(this.checkpointsDir, `${id}.patch`);
          fs.writeFileSync(patchPath, diff, 'utf-8');
        }

        const statusOutput = execFileSync('git', ['status', '--porcelain'], {
          cwd: this.workspaceRoot,
          stdio: ['ignore', 'pipe', 'ignore'],
        }).toString();
        for (const line of statusOutput.split('\n').filter(Boolean)) {
          const filePath = line.slice(3).trim();
          if (line.startsWith('??')) {
            untrackedFiles.push(filePath);
          } else {
            modifiedFiles.push(filePath);
          }
        }
      } catch (err: any) {
        restorable = false;
        reason = `This repository has no commit to snapshot from (${err.message || 'git rev-parse failed'}).`;
      }
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
      restorable,
      reason,
    };

    const recordPath = path.join(this.checkpointsDir, `${id}.json`);
    fs.writeFileSync(recordPath, JSON.stringify(record, null, 2), 'utf-8');
    this.pruneAutoCheckpoints();
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
          } catch {}
        }
      }
    } catch {}

    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  public restoreCheckpoint(id: string): { success: boolean; message: string } {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      return { success: false, message: `Checkpoint not found: ${id}` };
    }

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

    if (record.restorable === false || record.commit === 'no_git') {
      return {
        success: false,
        message: `Checkpoint ${id} cannot be restored: ${record.reason || 'no restorable Git snapshot was captured.'}`,
      };
    }

    if (!this.isGitRepository()) {
      return {
        success: false,
        message: `Checkpoint ${id} cannot be restored: this workspace is no longer a Git repository.`,
      };
    }

    this.createCheckpoint(`safety_before_restore_${id}`);

    try {
      execFileSync('git', ['checkout', '--', '.'], {
        cwd: this.workspaceRoot,
        stdio: ['ignore', 'pipe', 'ignore'],
      });

      if (record.patchPath && fs.existsSync(record.patchPath)) {
        execFileSync('git', ['apply', record.patchPath], {
          cwd: this.workspaceRoot,
          stdio: ['ignore', 'pipe', 'ignore'],
        });
      }

      const untrackedNote =
        record.untrackedFiles.length > 0
          ? ` ${record.untrackedFiles.length} untracked path(s) present at snapshot time were not stored and may not be restored.`
          : '';
      return {
        success: true,
        message: `Successfully restored checkpoint ${id} (${record.name}).${untrackedNote}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Error restoring checkpoint: ${err.message}`,
      };
    }
  }

  public undo(): { success: boolean; message: string } {
    const list = this.listCheckpoints().filter((c) => !c.name.startsWith('safety_before_restore_'));
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
      const suffix =
        cp.restorable === false || cp.commit === 'no_git'
          ? ' (not restorable)'
          : modCount > 0
            ? ` (${modCount} files modified)`
            : ' (clean)';
      lines.push(
        `• ${cp.id.padEnd(28)} ${dateStr}  ${cp.name}` + suffix
      );
    }

    return lines.join('\n');
  }
}

export const CheckpointCreateInputSchema = z.object({
  name: z.string().optional().describe('Human-readable checkpoint name'),
});

export class CheckpointCreateTool implements Tool<z.infer<typeof CheckpointCreateInputSchema>> {
  public readonly metadata = {
    name: 'checkpoint_create',
    description: 'Create a restorable checkpoint of the current Git working tree',
    category: 'git' as const,
    risk: 'medium' as const,
  };

  public readonly schema = CheckpointCreateInputSchema;

  public async execute(args: z.infer<typeof CheckpointCreateInputSchema>, context: ToolContext): Promise<ToolExecutionResult> {
    const record = new CheckpointManager(context.workspaceRoot).createCheckpoint(args.name);
    if (!record.restorable) {
      return {
        success: false,
        output: `Created checkpoint metadata ${record.id}, but it cannot restore files: ${record.reason}`,
        error: 'CHECKPOINT_NOT_RESTORABLE',
        data: record,
      };
    }
    return {
      success: true,
      output: `Created checkpoint ${record.id}`,
      data: record,
    };
  }
}

export const CheckpointRestoreInputSchema = z.object({
  id: z.string().describe('Checkpoint identifier to restore'),
});

export class CheckpointRestoreTool implements Tool<z.infer<typeof CheckpointRestoreInputSchema>> {
  public readonly metadata = {
    name: 'checkpoint_restore',
    description: 'Restore a checkpoint after creating a safety backup',
    category: 'git' as const,
    risk: 'critical' as const,
  };

  public readonly schema = CheckpointRestoreInputSchema;

  public async execute(args: z.infer<typeof CheckpointRestoreInputSchema>, context: ToolContext): Promise<ToolExecutionResult> {
    const result = new CheckpointManager(context.workspaceRoot).restoreCheckpoint(args.id);
    return {
      success: result.success,
      output: result.message,
      error: result.success ? undefined : 'CHECKPOINT_RESTORE_FAILED',
    };
  }
}

export const CheckpointUndoInputSchema = z.object({});

export class CheckpointUndoTool implements Tool<z.infer<typeof CheckpointUndoInputSchema>> {
  public readonly metadata = {
    name: 'checkpoint_undo',
    description: 'Restore the most recent checkpoint after creating a safety backup',
    category: 'git' as const,
    risk: 'critical' as const,
  };

  public readonly schema = CheckpointUndoInputSchema;

  public async execute(_args: z.infer<typeof CheckpointUndoInputSchema>, context: ToolContext): Promise<ToolExecutionResult> {
    const result = new CheckpointManager(context.workspaceRoot).undo();
    return {
      success: result.success,
      output: result.message,
      error: result.success ? undefined : 'CHECKPOINT_UNDO_FAILED',
    };
  }
}
