import { spawn, ChildProcess } from 'node:child_process';

export interface BackgroundTask {
  id: number;
  command: string;
  cwd: string;
  status: 'RUNNING' | 'COMPLETE' | 'FAILED';
  startTime: number;
  endTime?: number;
  exitCode?: number;
  outputBuffer: string;
}

export class BackgroundTaskManager {
  private static instance: BackgroundTaskManager | null = null;
  private tasks: Map<number, BackgroundTask> = new Map();
  private processes: Map<number, ChildProcess> = new Map();
  private nextId = 1;

  public static getInstance(): BackgroundTaskManager {
    if (!BackgroundTaskManager.instance) {
      BackgroundTaskManager.instance = new BackgroundTaskManager();
    }
    return BackgroundTaskManager.instance;
  }

  public startTask(command: string, cwd: string = process.cwd()): BackgroundTask {
    const id = this.nextId++;
    const task: BackgroundTask = {
      id,
      command,
      cwd,
      status: 'RUNNING',
      startTime: Date.now(),
      outputBuffer: '',
    };

    this.tasks.set(id, task);

    try {
      const child = spawn(command, {
        cwd,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.processes.set(id, child);

      child.stdout?.on('data', (data) => {
        task.outputBuffer += data.toString();
        if (task.outputBuffer.length > 50000) {
          task.outputBuffer = task.outputBuffer.slice(-50000);
        }
      });

      child.stderr?.on('data', (data) => {
        task.outputBuffer += data.toString();
        if (task.outputBuffer.length > 50000) {
          task.outputBuffer = task.outputBuffer.slice(-50000);
        }
      });

      child.on('exit', (code) => {
        task.status = code === 0 ? 'COMPLETE' : 'FAILED';
        task.exitCode = code ?? undefined;
        task.endTime = Date.now();
        this.processes.delete(id);
      });

      child.on('error', (err) => {
        task.status = 'FAILED';
        task.outputBuffer += `\n[Process Error]: ${err.message}`;
        task.endTime = Date.now();
        this.processes.delete(id);
      });
    } catch (err: any) {
      task.status = 'FAILED';
      task.outputBuffer = `Failed to spawn process: ${err.message}`;
      task.endTime = Date.now();
    }

    return task;
  }

  public listTasks(): BackgroundTask[] {
    return Array.from(this.tasks.values()).sort((a, b) => b.id - a.id);
  }

  public getTask(id: number | string): BackgroundTask | undefined {
    const numId = typeof id === 'string' ? parseInt(id.replace(/^#/, ''), 10) : id;
    return this.tasks.get(numId);
  }

  public stopTask(id: number | string): boolean {
    const numId = typeof id === 'string' ? parseInt(id.replace(/^#/, ''), 10) : id;
    const proc = this.processes.get(numId);
    const task = this.tasks.get(numId);

    if (proc && !proc.killed) {
      proc.kill('SIGTERM');
      setTimeout(() => {
        if (!proc.killed) proc.kill('SIGKILL');
      }, 1000);

      if (task) {
        task.status = 'FAILED';
        task.outputBuffer += '\n[Terminated by user]';
        task.endTime = Date.now();
      }
      this.processes.delete(numId);
      return true;
    }
    return false;
  }

  public stopAll(): void {
    for (const [id, proc] of this.processes.entries()) {
      if (!proc.killed) {
        try {
          proc.kill('SIGTERM');
          setTimeout(() => {
            if (!proc.killed) proc.kill('SIGKILL');
          }, 500);
        } catch {
          // ignore
        }
      }
      const task = this.tasks.get(id);
      if (task && task.status === 'RUNNING') {
        task.status = 'FAILED';
        task.outputBuffer += '\n[Terminated by user]';
        task.endTime = Date.now();
      }
    }
    this.processes.clear();
  }

  public formatTaskList(): string {
    const list = this.listTasks();
    if (list.length === 0) {
      return 'No background tasks running or completed.';
    }

    const lines = [
      `BACKGROUND TASKS:`,
      `────────────────────────────────────────────────────────────`,
    ];

    for (const t of list.slice(0, 10)) {
      const idStr = `#${t.id}`.padEnd(5);
      const statusStr = t.status.padEnd(9);
      const elapsedSec = Math.round(((t.endTime || Date.now()) - t.startTime) / 1000);
      lines.push(`${idStr} ${statusStr} ${t.command.slice(0, 35).padEnd(36)} (${elapsedSec}s)`);
    }

    return lines.join('\n');
  }
}
