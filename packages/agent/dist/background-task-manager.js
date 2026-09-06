import { spawn } from 'node:child_process';
export class BackgroundTaskManager {
    static instance = null;
    tasks = new Map();
    processes = new Map();
    nextId = 1;
    static getInstance() {
        if (!BackgroundTaskManager.instance) {
            BackgroundTaskManager.instance = new BackgroundTaskManager();
        }
        return BackgroundTaskManager.instance;
    }
    startTask(command, cwd = process.cwd()) {
        const id = this.nextId++;
        const task = {
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
        }
        catch (err) {
            task.status = 'FAILED';
            task.outputBuffer = `Failed to spawn process: ${err.message}`;
            task.endTime = Date.now();
        }
        return task;
    }
    listTasks() {
        return Array.from(this.tasks.values()).sort((a, b) => b.id - a.id);
    }
    getTask(id) {
        const numId = typeof id === 'string' ? parseInt(id.replace(/^#/, ''), 10) : id;
        return this.tasks.get(numId);
    }
    stopTask(id) {
        const numId = typeof id === 'string' ? parseInt(id.replace(/^#/, ''), 10) : id;
        const proc = this.processes.get(numId);
        const task = this.tasks.get(numId);
        if (proc && !proc.killed) {
            proc.kill('SIGTERM');
            setTimeout(() => {
                if (!proc.killed)
                    proc.kill('SIGKILL');
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
    stopAll() {
        for (const [id, proc] of this.processes.entries()) {
            if (!proc.killed) {
                try {
                    proc.kill('SIGTERM');
                    setTimeout(() => {
                        if (!proc.killed)
                            proc.kill('SIGKILL');
                    }, 500);
                }
                catch {
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
    formatTaskList() {
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
//# sourceMappingURL=background-task-manager.js.map