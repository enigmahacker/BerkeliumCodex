import { exec } from 'node:child_process';
import { z } from 'zod';
import { resolveSafeWorkspacePath } from '../filesystem/path-utils.js';
import { sanitizeEnvironment } from './env-sanitizer.js';
export const RunShellInputSchema = z.object({
    command: z.string().describe('Shell command to execute'),
    cwd: z.string().optional().describe('Working directory relative to workspace root'),
    timeout_ms: z.number().default(30000).describe('Execution timeout in milliseconds'),
});
export class RunShellTool {
    metadata = {
        name: 'run_shell',
        description: 'Execute a shell command with timeout, sanitized environment, and working directory controls',
        category: 'shell',
        risk: 'medium',
        requiresConfirmation: false,
    };
    schema = RunShellInputSchema;
    execute(args, context) {
        return new Promise((resolve) => {
            let workingDir = context.workspaceRoot;
            if (args.cwd) {
                try {
                    workingDir = resolveSafeWorkspacePath(context.workspaceRoot, args.cwd);
                }
                catch (err) {
                    resolve({
                        success: false,
                        output: `Security violation in shell working directory: ${err.message}`,
                        error: 'INVALID_WORKING_DIRECTORY',
                    });
                    return;
                }
            }
            const timeout = args.timeout_ms || 30000;
            let outputBuffer = '';
            const child = exec(args.command, {
                cwd: workingDir,
                timeout,
                maxBuffer: 10 * 1024 * 1024,
                env: sanitizeEnvironment(),
            }, (error, stdout, stderr) => {
                const combined = stdout + (stderr ? `\n[STDERR]:\n${stderr}` : '');
                const trimmed = combined.trim();
                if (error) {
                    resolve({
                        success: false,
                        output: trimmed || error.message,
                        error: error.message,
                        metadata: {
                            exitCode: error.code || 1,
                            signal: error.signal,
                            timedOut: error.killed && error.signal === 'SIGTERM',
                        },
                    });
                }
                else {
                    resolve({
                        success: true,
                        output: trimmed || '(command produced no output)',
                        metadata: {
                            exitCode: 0,
                        },
                    });
                }
            });
            if (context.signal) {
                context.signal.addEventListener('abort', () => {
                    child.kill('SIGTERM');
                });
            }
            if (context.onOutput) {
                child.stdout?.on('data', (data) => {
                    outputBuffer += data;
                    context.onOutput?.(data.toString());
                });
                child.stderr?.on('data', (data) => {
                    outputBuffer += data;
                    context.onOutput?.(data.toString());
                });
            }
        });
    }
}
//# sourceMappingURL=run-shell.js.map