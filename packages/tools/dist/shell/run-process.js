import { spawn } from 'node:child_process';
import * as path from 'node:path';
import { z } from 'zod';
export const RunProcessInputSchema = z.object({
    executable: z.string().describe('Binary or executable path to launch'),
    args: z.array(z.string()).default([]).describe('Arguments array'),
    cwd: z.string().optional().describe('Working directory relative to workspace root'),
    timeout_ms: z.number().default(30000).describe('Timeout in milliseconds'),
});
export class RunProcessTool {
    metadata = {
        name: 'run_process',
        description: 'Spawn a direct system process with arguments array',
        category: 'shell',
        risk: 'medium',
    };
    schema = RunProcessInputSchema;
    execute(args, context) {
        return new Promise((resolve) => {
            const workingDir = args.cwd
                ? path.resolve(context.workspaceRoot, args.cwd)
                : context.workspaceRoot;
            const child = spawn(args.executable, args.args, {
                cwd: workingDir,
                env: { ...process.env, CI: '1' },
            });
            let stdout = '';
            let stderr = '';
            let killed = false;
            const timer = setTimeout(() => {
                killed = true;
                child.kill('SIGTERM');
            }, args.timeout_ms || 30000);
            child.stdout.on('data', (d) => {
                const str = d.toString();
                stdout += str;
                context.onOutput?.(str);
            });
            child.stderr.on('data', (d) => {
                const str = d.toString();
                stderr += str;
                context.onOutput?.(str);
            });
            if (context.signal) {
                context.signal.addEventListener('abort', () => {
                    killed = true;
                    child.kill('SIGKILL');
                });
            }
            child.on('close', (code, signal) => {
                clearTimeout(timer);
                const combined = stdout + (stderr ? `\n[STDERR]:\n${stderr}` : '');
                if (code === 0) {
                    resolve({
                        success: true,
                        output: combined.trim() || '(process completed with exit code 0)',
                        metadata: { exitCode: 0 },
                    });
                }
                else {
                    resolve({
                        success: false,
                        output: combined.trim() || `Process exited with code ${code}`,
                        error: killed ? 'PROCESS_TIMED_OUT' : `Exit code ${code}`,
                        metadata: { exitCode: code, signal, timedOut: killed },
                    });
                }
            });
            child.on('error', (err) => {
                clearTimeout(timer);
                resolve({
                    success: false,
                    output: `Failed to spawn process "${args.executable}": ${err.message}`,
                    error: err.message,
                });
            });
        });
    }
}
//# sourceMappingURL=run-process.js.map