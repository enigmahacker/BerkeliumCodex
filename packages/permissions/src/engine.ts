import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import { EventBus } from '@berkelium/events';
import { PermissionPolicy } from '@berkelium/config';
import {
  PermissionRequest,
  PermissionCheckResult,
  PermissionPromptHandler,
  RiskLevel,
} from './types.js';

function canonicalizePath(targetPath: string): string {
  const resolved = path.resolve(targetPath);
  try {
    if (fs.existsSync(resolved)) {
      return fs.realpathSync(resolved);
    }
    let curr = resolved;
    const parts: string[] = [];
    while (curr && curr !== path.dirname(curr)) {
      if (fs.existsSync(curr)) {
        const canonicalAncestor = fs.realpathSync(curr);
        return path.resolve(canonicalAncestor, ...parts.reverse());
      }
      parts.push(path.basename(curr));
      curr = path.dirname(curr);
    }
    return resolved;
  } catch {
    return resolved;
  }
}

export class PermissionEngine {
  private workspaceRoot: string;
  private policy: PermissionPolicy;
  private eventBus?: EventBus;
  private promptHandler?: PermissionPromptHandler;
  private sessionApprovals: Set<string> = new Set();

  private safeShellCommands = new Set([
    'ls', 'dir', 'pwd', 'cat', 'head', 'tail', 'grep', 'rg', 'find', 'git',
    'echo', 'which', 'where', 'node', 'npm test', 'npm run test', 'pnpm test',
    'cargo test', 'pytest', 'vitest', 'tsc', 'diff', 'cargo check', 'go test',
  ]);

  private dangerousShellPatterns: Array<{ pattern: RegExp; reason: string }> = [
    { pattern: /:(){ :|:& };:/, reason: 'Bash fork bomb detected' },
    { pattern: /rm\s+(-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*|-[a-zA-Z]*f[a-zA-Z]*r[a-zA-Z]*)\s+(\/|\/\*|~|\$HOME|\.\.)(\s|$)/, reason: 'Destructive root/home directory deletion' },
    { pattern: /\bmkfs(?:\.[\w]+)?\b/, reason: 'Filesystem format command detected' },
    { pattern: /\bfdisk\b/, reason: 'Disk partition manipulation detected' },
    { pattern: /\bdd\s+if=/, reason: 'Raw disk block copy / overwrite command detected' },
    { pattern: /\bchmod\s+(?:-R\s+)?777\b/, reason: 'Insecure universal file permissions (777)' },
    { pattern: />\s*\/dev\/(?:sd[a-z]|nvme\d|disk\d)/, reason: 'Direct write to raw block device' },
    { pattern: /(?:curl|wget)\s+[^|]+\|\s*(?:bash|sh|zsh)/, reason: 'Piping remote network download directly to shell execution' },
    { pattern: /\b(?:shutdown|reboot|halt|init\s+0|init\s+6)\b/, reason: 'System shutdown or reboot command' },
    { pattern: /\bkillall\s+-9\b/, reason: 'Destructive mass process kill' },
    { pattern: /\bgit\s+push\s+(?:-f|--force)\b/, reason: 'Destructive remote Git force push' },
    { pattern: /\bgit\s+reset\s+--hard\b/, reason: 'Destructive uncommitted Git reset' },
    { pattern: /\bgit\s+clean\s+-(?:[a-zA-Z]*x[a-zA-Z]*f|f[a-zA-Z]*d)\b/, reason: 'Destructive Git untracked workspace purge' },
    { pattern: /\b(?:sudo|su|doas)\b/, reason: 'Privilege escalation command detected' },
  ];

  private sensitiveFilePatterns: Array<{ pattern: RegExp; reason: string }> = [
    { pattern: /[\\/]\.ssh[\\/]/i, reason: 'SSH keys and configuration directory' },
    { pattern: /[\\/]\.aws[\\/]/i, reason: 'AWS cloud credentials directory' },
    { pattern: /[\\/]\.gnupg[\\/]/i, reason: 'GnuPG private keys directory' },
    { pattern: /[\\/]\.kube[\\/]/i, reason: 'Kubernetes cluster credentials directory' },
    { pattern: /[\\/]\.docker[\\/]/i, reason: 'Docker authentication credentials' },
    { pattern: /[\\/]Library[\\/]Keychains[\\/]/i, reason: 'macOS Keychain directory' },
    { pattern: /[\\/]\.env(?:\.[\w.-]+)?$/i, reason: 'Environment secrets file (.env)' },
    { pattern: /(?:id_rsa|id_ed25519|id_ecdsa|id_dsa)(?:\.pub)?$/i, reason: 'Private/Public SSH key file' },
    { pattern: /(?:credentials|secrets|service-account|serviceAccount)\.json$/i, reason: 'Service account credentials file' },
    { pattern: /\.(?:pem|key|pfx|p12|pkcs12)$/i, reason: 'Cryptographic certificate/private key file' },
    { pattern: /^\/etc\/(?:passwd|shadow|sudoers|master\.passwd)$/i, reason: 'System authentication file' },
  ];

  constructor(
    workspaceRoot: string,
    policy: PermissionPolicy,
    eventBus?: EventBus,
    promptHandler?: PermissionPromptHandler
  ) {
    this.workspaceRoot = canonicalizePath(workspaceRoot);
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

  public getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  public isWithinWorkspace(targetPath: string): boolean {
    const resolved = path.resolve(this.workspaceRoot, targetPath);

    // If file exists on disk, check its realpath
    if (fs.existsSync(resolved)) {
      try {
        const canonical = fs.realpathSync(resolved);
        return canonical === this.workspaceRoot || canonical.startsWith(this.workspaceRoot + path.sep);
      } catch {
        return false;
      }
    }

    // For non-existent files, check canonical ancestor
    const canonical = canonicalizePath(resolved);
    return canonical === this.workspaceRoot || canonical.startsWith(this.workspaceRoot + path.sep);
  }

  public isSensitivePath(targetPath: string): { isSensitive: boolean; reason?: string } {
    const normalized = path.resolve(this.workspaceRoot, targetPath);
    const homeDir = os.homedir();

    // Check home directory sensitive paths
    if (normalized.startsWith(homeDir)) {
      const relHome = path.relative(homeDir, normalized);
      for (const { pattern, reason } of this.sensitiveFilePatterns) {
        if (pattern.test('/' + relHome) || pattern.test(normalized)) {
          return { isSensitive: true, reason };
        }
      }
    }

    // Check base patterns
    for (const { pattern, reason } of this.sensitiveFilePatterns) {
      if (pattern.test(normalized) || pattern.test(path.basename(normalized))) {
        return { isSensitive: true, reason };
      }
    }

    return { isSensitive: false };
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
      this.eventBus?.emit({
        id: crypto.randomUUID(),
        type: 'security_blocked',
        sessionId: 'current',
        timestamp: Date.now(),
        action: request.action,
        target: request.target,
        reason: check.reason || 'Blocked by security policy',
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
      risk: check.risk || request.risk,
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
        reason: 'No permission handler registered to prompt user for confirmation',
      });
      return false;
    }

    const decision = await this.promptHandler({
      ...request,
      risk: check.risk || request.risk,
    });

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
      case 'mcp':
        return this.checkMcp(request);
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
    const target = request.target;
    const isInside = this.isWithinWorkspace(target);
    const sensitive = this.isSensitivePath(target);
    const act = request.action.toLowerCase();

    // 1. If path escapes workspace or symlinks outside
    if (!isInside) {
      this.eventBus?.emit({
        id: crypto.randomUUID(),
        type: 'path_escape_blocked',
        sessionId: 'current',
        timestamp: Date.now(),
        attemptedPath: target,
        workspaceRoot: this.workspaceRoot,
        reason: 'Path traversal or symlink escapes authorized workspace root',
      });
    }

    // 2. Sensitive files protection (SSH keys, AWS credentials, .env, etc.)
    if (sensitive.isSensitive) {
      this.eventBus?.emit({
        id: crypto.randomUUID(),
        type: 'security_warning',
        sessionId: 'current',
        timestamp: Date.now(),
        category: 'filesystem',
        target,
        warning: `Access requested for sensitive path: ${sensitive.reason}`,
      });

      // Default deny or critical prompt
      return {
        allowed: false,
        requiresPrompt: true,
        risk: 'critical',
        reason: `Target path is sensitive (${sensitive.reason}). Explicit confirmation required.`,
      };
    }

    // Read actions
    if (
      act.includes('read') ||
      act === 'list_directory' ||
      act === 'search_files' ||
      act === 'search_text' ||
      act === 'inspect_project'
    ) {
      if (!isInside) {
        return {
          allowed: false,
          requiresPrompt: true,
          risk: 'high',
          reason: 'Reading files outside the workspace boundary requires explicit confirmation',
        };
      }
      const pol = this.policy.filesystem.read;
      if (pol === 'allow') return { allowed: true, requiresPrompt: false, risk: 'low' };
      if (pol === 'deny') return { allowed: false, requiresPrompt: false, risk: 'low', reason: 'Filesystem read denied by policy' };
      return { allowed: false, requiresPrompt: true, risk: 'low' };
    }

    // Write / Edit actions
    if (act.includes('write') || act.includes('edit') || act.includes('create')) {
      if (!isInside) {
        const pol = this.policy.filesystem.write.outside_workspace;
        if (pol === 'deny') return { allowed: false, requiresPrompt: false, risk: 'high', reason: 'Writing outside workspace is denied by policy' };
        return { allowed: false, requiresPrompt: true, risk: 'high', reason: 'Writing outside workspace boundary requires explicit confirmation' };
      }

      const pol = this.policy.filesystem.write.workspace;
      if (pol === 'allow') return { allowed: true, requiresPrompt: false, risk: 'low' };
      if (pol === 'deny') return { allowed: false, requiresPrompt: false, risk: 'high', reason: 'Filesystem write denied by policy' };
      return { allowed: false, requiresPrompt: true, risk: 'medium' };
    }

    // Delete actions
    if (act.includes('delete') || act.includes('unlink') || act.includes('remove')) {
      if (!isInside) {
        const pol = this.policy.filesystem.delete.outside_workspace;
        if (pol === 'deny') return { allowed: false, requiresPrompt: false, risk: 'critical', reason: 'Deleting outside workspace is denied by policy' };
        return { allowed: false, requiresPrompt: true, risk: 'critical', reason: 'Deleting files outside workspace requires explicit confirmation' };
      }

      const pol = this.policy.filesystem.delete.workspace;
      if (pol === 'allow') return { allowed: true, requiresPrompt: false, risk: 'medium' };
      if (pol === 'deny') return { allowed: false, requiresPrompt: false, risk: 'critical', reason: 'File deletion denied by policy' };
      return { allowed: false, requiresPrompt: true, risk: 'medium' };
    }

    return { allowed: false, requiresPrompt: true, risk: 'medium' };
  }

  private checkShell(request: PermissionRequest): PermissionCheckResult {
    const cmd = request.target.trim();

    // Check for dangerous / destructive patterns
    for (const { pattern, reason } of this.dangerousShellPatterns) {
      if (pattern.test(cmd)) {
        this.eventBus?.emit({
          id: crypto.randomUUID(),
          type: 'unsafe_command_blocked',
          sessionId: 'current',
          timestamp: Date.now(),
          command: cmd,
          reason,
        });

        const pol = this.policy.shell.privileged;
        if (pol === 'deny') {
          return {
            allowed: false,
            requiresPrompt: false,
            risk: 'critical',
            reason: `Dangerous shell command denied: ${reason}`,
          };
        }
        return {
          allowed: false,
          requiresPrompt: true,
          risk: 'critical',
          reason: `Potentially dangerous command (${reason}) requires explicit user confirmation.`,
        };
      }
    }

    // Check if known safe read-only command without chained execution
    const firstWord = cmd.split(' ')[0];
    const isKnownSafe = this.safeShellCommands.has(firstWord) || this.safeShellCommands.has(cmd);
    const hasChainOperators = cmd.includes('&&') || cmd.includes(';') || cmd.includes('|') || cmd.includes('`') || cmd.includes('$(');

    if (isKnownSafe && !hasChainOperators) {
      const pol = this.policy.shell.safe;
      if (pol === 'allow') return { allowed: true, requiresPrompt: false, risk: 'low' };
      if (pol === 'deny') return { allowed: false, requiresPrompt: false, risk: 'low', reason: 'Shell execution denied' };
      return { allowed: false, requiresPrompt: true, risk: 'low' };
    }

    // General shell commands
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

  private checkMcp(request: PermissionRequest): PermissionCheckResult {
    return {
      allowed: false,
      requiresPrompt: true,
      risk: request.risk || 'medium',
      reason: `MCP Tool "${request.action}" requires confirmation`,
    };
  }
}
