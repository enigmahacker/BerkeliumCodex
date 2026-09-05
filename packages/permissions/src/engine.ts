import * as path from 'node:path';
import * as fs from 'node:fs';
import { EventBus } from '@berkelium/events';
import { PermissionPolicy } from '@berkelium/config';
import {
  PermissionRequest,
  PermissionCheckResult,
  PermissionPromptHandler,
} from './types.js';

export class PermissionEngine {
  private workspaceRoot: string;
  private policy: PermissionPolicy;
  private eventBus?: EventBus;
  private promptHandler?: PermissionPromptHandler;
  private sessionApprovals: Set<string> = new Set();

  private safeShellCommands = new Set([
    'ls', 'dir', 'pwd', 'cat', 'head', 'tail', 'grep', 'rg', 'find', 'git',
    'echo', 'which', 'where', 'node', 'npm test', 'npm run test', 'pnpm test',
    'cargo test', 'pytest', 'vitest', 'tsc', 'diff',
  ]);

  private dangerousShellPatterns = [
    /rm\s+-rf\s+\//,
    /mkfs/,
    /fdisk/,
    /dd\s+if=/,
    /chmod\s+-R\s+777/,
    /:(){ :|:& };:/, // fork bomb
    />\s*\/dev\/sda/,
    /curl.*\|\s*(?:bash|sh|zsh)/,
    /wget.*\|\s*(?:bash|sh|zsh)/,
  ];

  constructor(
    workspaceRoot: string,
    policy: PermissionPolicy,
    eventBus?: EventBus,
    promptHandler?: PermissionPromptHandler
  ) {
    try {
      this.workspaceRoot = fs.realpathSync(workspaceRoot);
    } catch {
      this.workspaceRoot = path.resolve(workspaceRoot);
    }
    this.policy = policy;
    this.eventBus = eventBus;
    this.promptHandler = promptHandler;
  }

  public setPromptHandler(handler: PermissionPromptHandler): void {
    this.promptHandler = handler;
  }

  public setPolicy(policy: PermissionPolicy): void {
    this.policy = policy;
  }

  public async evaluate(request: PermissionRequest): Promise<boolean> {
    const check = this.checkPolicy(request);

    if (check.allowed && !check.requiresPrompt) {
      return true;
    }

    if (!check.allowed && !check.requiresPrompt) {
      this.eventBus?.emit({
        id: crypto.randomUUID(),
        type: 'permission_denied',
        sessionId: 'current',
        timestamp: Date.now(),
        permissionId: request.id,
        reason: check.reason || 'Policy explicitly denies this action',
      });
      return false;
    }

    // Check if previously approved for this session
    const approvalKey = `${request.category}:${request.action}:${request.target}`;
    if (this.sessionApprovals.has(approvalKey)) {
      return true;
    }

    // Requires user confirmation
    this.eventBus?.emit({
      id: crypto.randomUUID(),
      type: 'permission_requested',
      sessionId: 'current',
      timestamp: Date.now(),
      permissionId: request.id,
      action: request.action,
      target: request.target,
      risk: request.risk,
      details: request.metadata,
    });

    if (!this.promptHandler) {
      // Default to deny if no prompt handler is registered
      this.eventBus?.emit({
        id: crypto.randomUUID(),
        type: 'permission_denied',
        sessionId: 'current',
        timestamp: Date.now(),
        permissionId: request.id,
        reason: 'No permission handler registered to prompt user',
      });
      return false;
    }

    const decision = await this.promptHandler(request);

    if (decision === 'always_allow') {
      this.sessionApprovals.add(approvalKey);
      this.eventBus?.emit({
        id: crypto.randomUUID(),
        type: 'permission_granted',
        sessionId: 'current',
        timestamp: Date.now(),
        permissionId: request.id,
        remember: true,
      });
      return true;
    }

    if (decision === 'allow') {
      this.eventBus?.emit({
        id: crypto.randomUUID(),
        type: 'permission_granted',
        sessionId: 'current',
        timestamp: Date.now(),
        permissionId: request.id,
        remember: false,
      });
      return true;
    }

    this.eventBus?.emit({
      id: crypto.randomUUID(),
      type: 'permission_denied',
      sessionId: 'current',
      timestamp: Date.now(),
      permissionId: request.id,
      reason: 'User denied permission',
    });
    return false;
  }

  public checkPolicy(request: PermissionRequest): PermissionCheckResult {
    switch (request.category) {
      case 'filesystem':
        return this.checkFilesystem(request);
      case 'shell':
        return this.checkShell(request);
      case 'git':
        return this.checkGit(request);
      case 'diagnostics':
        return { allowed: true, requiresPrompt: false, risk: 'low' };
      case 'network':
      case 'web':
        return this.checkNetwork(request);
      default:
        return {
          allowed: false,
          requiresPrompt: true,
          risk: request.risk,
          reason: 'Custom action requires confirmation',
        };
    }
  }

  private checkFilesystem(request: PermissionRequest): PermissionCheckResult {
    let targetPath = path.resolve(this.workspaceRoot, request.target);
    try {
      if (fs.existsSync(targetPath)) {
        targetPath = fs.realpathSync(targetPath);
      }
    } catch {}

    const isInsideWorkspace = targetPath.startsWith(this.workspaceRoot);
    const act = request.action.toLowerCase();

    // Read actions
    if (
      act.includes('read') ||
      act === 'list_directory' ||
      act === 'search_files' ||
      act === 'search_text' ||
      act === 'inspect_project'
    ) {
      const pol = this.policy.filesystem.read;
      if (pol === 'allow') return { allowed: true, requiresPrompt: false, risk: 'low' };
      if (pol === 'deny') return { allowed: false, requiresPrompt: false, risk: 'low', reason: 'Filesystem read denied by policy' };
      return { allowed: false, requiresPrompt: true, risk: 'low' };
    }

    // Write / Edit actions
    if (act.includes('write') || act.includes('edit') || act.includes('create')) {
      const pol = isInsideWorkspace
        ? this.policy.filesystem.write.workspace
        : this.policy.filesystem.write.outside_workspace;

      if (pol === 'allow') return { allowed: true, requiresPrompt: false, risk: isInsideWorkspace ? 'low' : 'medium' };
      if (pol === 'deny') return { allowed: false, requiresPrompt: false, risk: 'high', reason: 'Filesystem write denied by policy' };
      return { allowed: false, requiresPrompt: true, risk: isInsideWorkspace ? 'medium' : 'high' };
    }

    // Delete actions
    if (act.includes('delete') || act.includes('unlink') || act.includes('remove')) {
      const pol = isInsideWorkspace
        ? this.policy.filesystem.delete.workspace
        : this.policy.filesystem.delete.outside_workspace;

      if (pol === 'allow') return { allowed: true, requiresPrompt: false, risk: 'medium' };
      if (pol === 'deny') return { allowed: false, requiresPrompt: false, risk: 'critical', reason: 'File deletion denied by policy' };
      return { allowed: false, requiresPrompt: true, risk: isInsideWorkspace ? 'medium' : 'high' };
    }

    return { allowed: false, requiresPrompt: true, risk: 'medium' };
  }

  private checkShell(request: PermissionRequest): PermissionCheckResult {
    const cmd = request.target.trim();

    // Check for critical privileged / system destruction patterns
    if (cmd.startsWith('sudo ') || this.dangerousShellPatterns.some((pat) => pat.test(cmd))) {
      const pol = this.policy.shell.privileged;
      if (pol === 'deny') {
        return {
          allowed: false,
          requiresPrompt: false,
          risk: 'critical',
          reason: 'Privileged or dangerous command denied by policy',
        };
      }
      return { allowed: false, requiresPrompt: true, risk: 'critical' };
    }

    // Check if safe command
    const firstWord = cmd.split(' ')[0];
    const isKnownSafe = this.safeShellCommands.has(firstWord) || this.safeShellCommands.has(cmd);

    if (isKnownSafe && !cmd.includes('&&') && !cmd.includes(';') && !cmd.includes('|')) {
      const pol = this.policy.shell.safe;
      if (pol === 'allow') return { allowed: true, requiresPrompt: false, risk: 'low' };
      if (pol === 'deny') return { allowed: false, requiresPrompt: false, risk: 'low', reason: 'Shell execution denied' };
      return { allowed: false, requiresPrompt: true, risk: 'low' };
    }

    // Destructive / General shell commands
    const pol = this.policy.shell.destructive;
    if (pol === 'allow') return { allowed: true, requiresPrompt: false, risk: 'medium' };
    if (pol === 'deny') return { allowed: false, requiresPrompt: false, risk: 'high', reason: 'Shell command denied by policy' };
    return { allowed: false, requiresPrompt: true, risk: 'medium' };
  }

  private checkGit(request: PermissionRequest): PermissionCheckResult {
    const act = request.action.toLowerCase();
    if (act === 'git_status' || act === 'git_diff' || act === 'git_log' || act === 'git_branch') {
      return { allowed: true, requiresPrompt: false, risk: 'low' };
    }
    return { allowed: true, requiresPrompt: false, risk: 'medium' };
  }

  private checkNetwork(request: PermissionRequest): PermissionCheckResult {
    const domain = request.target;
    if (this.policy.network.allowed_domains.includes(domain)) {
      return { allowed: true, requiresPrompt: false, risk: 'low' };
    }
    const pol = this.policy.network.default;
    if (pol === 'allow') return { allowed: true, requiresPrompt: false, risk: 'medium' };
    if (pol === 'deny') return { allowed: false, requiresPrompt: false, risk: 'medium', reason: 'Network access denied' };
    return { allowed: false, requiresPrompt: true, risk: 'medium' };
  }
}
