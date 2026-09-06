import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
function canonicalizePath(targetPath) {
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
export class PermissionEngine {
    workspaceRoot;
    policy;
    permissionLevel;
    eventBus;
    promptHandler;
    sessionApprovals = new Set();
    sessionDenials = new Set();
    granularGrants = new Map();
    safeShellCommands = new Set([
        'ls', 'dir', 'pwd', 'cat', 'head', 'tail', 'grep', 'rg', 'find', 'git',
        'echo', 'which', 'where', 'node', 'npm test', 'npm run test', 'pnpm test',
        'cargo test', 'pytest', 'vitest', 'tsc', 'diff', 'cargo check', 'go test',
    ]);
    dangerousShellPatterns = [
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
        { pattern: /\bgit\s+clean\s+-(?:[a-zA-Z]*x[a-zA-Z]*f|f[a-zA-Z]*d|[a-zA-Z]*f[a-zA-Z]*d)\b/, reason: 'Destructive Git untracked workspace purge' },
        { pattern: /\bgit\s+branch\s+-(?:D)\b/, reason: 'Destructive unmerged Git branch deletion' },
        { pattern: /\bdiskutil\s+eraseDisk\b/, reason: 'Raw disk erase command' },
        { pattern: /\b(?:sudo|su|doas)\b/, reason: 'Privilege escalation command detected' },
    ];
    sensitiveFilePatterns = [
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
    constructor(workspaceRoot, policy, eventBus, promptHandler) {
        this.workspaceRoot = canonicalizePath(workspaceRoot);
        this.policy = policy;
        this.permissionLevel = policy.level || 'auto';
        this.eventBus = eventBus;
        this.promptHandler = promptHandler;
        this.loadPersistentGrants();
    }
    setPromptHandler(handler) {
        this.promptHandler = handler;
    }
    setPolicy(policy) {
        this.policy = policy;
        if (policy.level) {
            this.permissionLevel = policy.level;
        }
    }
    getPolicy() {
        return this.policy;
    }
    setPermissionLevel(level) {
        this.permissionLevel = level;
        this.policy.level = level;
    }
    getPermissionLevel() {
        return this.permissionLevel;
    }
    setWorkspaceRoot(newRoot) {
        this.workspaceRoot = canonicalizePath(newRoot);
        this.loadPersistentGrants();
    }
    getWorkspaceRoot() {
        return this.workspaceRoot;
    }
    isWithinWorkspace(targetPath) {
        const resolved = path.resolve(this.workspaceRoot, targetPath);
        if (fs.existsSync(resolved)) {
            try {
                const canonical = fs.realpathSync(resolved);
                return canonical === this.workspaceRoot || canonical.startsWith(this.workspaceRoot + path.sep);
            }
            catch {
                return false;
            }
        }
        const canonical = canonicalizePath(resolved);
        return canonical === this.workspaceRoot || canonical.startsWith(this.workspaceRoot + path.sep);
    }
    isSensitivePath(targetPath) {
        const normalized = path.resolve(this.workspaceRoot, targetPath);
        const homeDir = os.homedir();
        if (normalized.startsWith(homeDir)) {
            const relHome = path.relative(homeDir, normalized);
            for (const { pattern, reason } of this.sensitiveFilePatterns) {
                if (pattern.test('/' + relHome) || pattern.test(normalized)) {
                    return { isSensitive: true, reason };
                }
            }
        }
        for (const { pattern, reason } of this.sensitiveFilePatterns) {
            if (pattern.test(normalized) || pattern.test(path.basename(normalized))) {
                return { isSensitive: true, reason };
            }
        }
        return { isSensitive: false };
    }
    isProtectedCommand(command) {
        const cmd = command.trim();
        for (const { pattern, reason } of this.dangerousShellPatterns) {
            if (pattern.test(cmd)) {
                return { isProtected: true, reason };
            }
        }
        return { isProtected: false };
    }
    grantCapability(grant) {
        this.granularGrants.set(grant.id, grant);
        if (grant.scope === 'project') {
            this.saveProjectGrant(grant);
        }
        else if (grant.scope === 'permanent') {
            this.savePermanentGrant(grant);
        }
    }
    revokeCapability(id) {
        const existed = this.granularGrants.delete(id);
        this.persistAllGrants();
        return existed;
    }
    listGrants() {
        return Array.from(this.granularGrants.values());
    }
    getGranularGrants() {
        return this.listGrants();
    }
    hasGrant(capability, target) {
        for (const grant of this.granularGrants.values()) {
            if (grant.capability === capability) {
                if (!grant.targetPattern || !target) {
                    return true;
                }
                if (target.includes(grant.targetPattern) || grant.targetPattern === '*') {
                    return true;
                }
            }
        }
        return false;
    }
    mapActionToCapability(category, action) {
        const act = action.toLowerCase();
        if (category === 'filesystem') {
            if (act.includes('delete') || act.includes('remove') || act.includes('unlink')) {
                return 'filesystem.delete';
            }
            if (act.includes('write') || act.includes('edit') || act.includes('create')) {
                return 'filesystem.write';
            }
            return 'filesystem.read';
        }
        if (category === 'shell') {
            if (act.includes('spawn'))
                return 'process.spawn';
            if (act.includes('kill'))
                return 'process.kill';
            return 'shell.execute';
        }
        if (category === 'git') {
            if (act.includes('push') || act.includes('commit') || act.includes('reset') || act.includes('checkout') || act.includes('restore')) {
                return 'git.write';
            }
            return 'git.read';
        }
        if (category === 'network' || category === 'web') {
            return 'network.access';
        }
        return 'shell.execute';
    }
    async evaluate(request) {
        const check = this.checkPolicy(request);
        if (check.allowed && !check.requiresPrompt) {
            return true;
        }
        if (!check.allowed && !check.requiresPrompt) {
            this.emitBlockedEvents(request, check.reason || 'Policy explicitly denies this action');
            return false;
        }
        // Check if previously approved or denied for this session
        const approvalKey = `${request.category}:${request.action}:${request.target}`;
        if (this.sessionApprovals.has(approvalKey)) {
            return true;
        }
        if (this.sessionDenials.has(approvalKey)) {
            return false;
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
            details: {
                ...request.metadata,
                isProtectedOperation: check.isProtectedOperation,
                permissionLevel: this.permissionLevel,
            },
        });
        if (!this.promptHandler) {
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
            isProtectedOperation: check.isProtectedOperation,
        });
        if (decision === 'allow' || decision === 'allow_once') {
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
        if (decision === 'always_allow' || decision === 'allow_session') {
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
        if (decision === 'allow_project') {
            this.sessionApprovals.add(approvalKey);
            const cap = this.mapActionToCapability(request.category, request.action);
            this.grantCapability({
                id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                capability: cap,
                targetPattern: request.target,
                scope: 'project',
                grantedAt: Date.now(),
            });
            return true;
        }
        if (decision === 'allow_permanent') {
            this.sessionApprovals.add(approvalKey);
            const cap = this.mapActionToCapability(request.category, request.action);
            this.grantCapability({
                id: `perm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                capability: cap,
                targetPattern: request.target,
                scope: 'permanent',
                grantedAt: Date.now(),
            });
            return true;
        }
        if (decision === 'deny_session') {
            this.sessionDenials.add(approvalKey);
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
    checkPolicy(request) {
        const capability = request.capability || this.mapActionToCapability(request.category, request.action);
        // Check granular grants
        if (this.hasGrant(capability, request.target)) {
            return { allowed: true, requiresPrompt: false, risk: request.risk };
        }
        // 1. Filesystem check
        if (request.category === 'filesystem') {
            return this.checkFilesystem(request);
        }
        // 2. Shell check
        if (request.category === 'shell') {
            return this.checkShell(request);
        }
        // 3. Git check
        if (request.category === 'git') {
            return this.checkGit(request);
        }
        // 4. Diagnostics check
        if (request.category === 'diagnostics') {
            return { allowed: true, requiresPrompt: false, risk: 'low' };
        }
        // 5. Network / Web check
        if (request.category === 'network' || request.category === 'web') {
            return this.checkNetwork(request);
        }
        // 6. MCP check
        if (request.category === 'mcp') {
            return this.checkMcp(request);
        }
        return {
            allowed: false,
            requiresPrompt: true,
            risk: request.risk,
            reason: 'Custom action requires confirmation',
        };
    }
    checkFilesystem(request) {
        const target = request.target;
        const isInside = this.isWithinWorkspace(target);
        const sensitive = this.isSensitivePath(target);
        const act = request.action.toLowerCase();
        // Sensitive files are NEVER auto-approved, regardless of mode
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
            return {
                allowed: false,
                requiresPrompt: true,
                risk: 'critical',
                isProtectedOperation: true,
                reason: `Target path is sensitive (${sensitive.reason}). Explicit confirmation required.`,
            };
        }
        // Reading files
        if (act.includes('read') ||
            act === 'list_directory' ||
            act === 'search_files' ||
            act === 'search_text' ||
            act === 'inspect_project') {
            if (this.permissionLevel === 'full') {
                return { allowed: true, requiresPrompt: false, risk: 'low' };
            }
            if (!isInside) {
                return {
                    allowed: false,
                    requiresPrompt: true,
                    risk: 'high',
                    reason: 'Reading files outside workspace boundary requires confirmation',
                };
            }
            if (this.permissionLevel === 'ask') {
                if (act === 'list_directory' || act === 'search_files') {
                    return { allowed: true, requiresPrompt: false, risk: 'low' };
                }
                return { allowed: false, requiresPrompt: true, risk: 'low' };
            }
            // Auto mode
            const pol = this.policy.filesystem.read;
            if (pol === 'allow')
                return { allowed: true, requiresPrompt: false, risk: 'low' };
            if (pol === 'deny')
                return { allowed: false, requiresPrompt: false, risk: 'low', reason: 'Filesystem read denied by policy' };
            return { allowed: false, requiresPrompt: true, risk: 'low' };
        }
        // Writing files
        if (act.includes('write') || act.includes('edit') || act.includes('create')) {
            if (this.permissionLevel === 'full') {
                if (isInside)
                    return { allowed: true, requiresPrompt: false, risk: 'low' };
                return { allowed: false, requiresPrompt: true, risk: 'high', reason: 'Writing outside workspace requires confirmation' };
            }
            if (this.permissionLevel === 'ask') {
                return { allowed: false, requiresPrompt: true, risk: 'medium', reason: 'Filesystem modification requires confirmation in ASK mode' };
            }
            // Auto mode
            if (!isInside) {
                const pol = this.policy.filesystem.write.outside_workspace;
                if (pol === 'deny')
                    return { allowed: false, requiresPrompt: false, risk: 'high', reason: 'Writing outside workspace is denied by policy' };
                return { allowed: false, requiresPrompt: true, risk: 'high', reason: 'Writing outside workspace boundary requires explicit confirmation' };
            }
            const pol = this.policy.filesystem.write.workspace;
            if (pol === 'allow')
                return { allowed: true, requiresPrompt: false, risk: 'low' };
            if (pol === 'deny')
                return { allowed: false, requiresPrompt: false, risk: 'high', reason: 'Filesystem write denied by policy' };
            return { allowed: false, requiresPrompt: true, risk: 'medium' };
        }
        // Deleting files
        if (act.includes('delete') || act.includes('unlink') || act.includes('remove')) {
            if (!isInside) {
                return {
                    allowed: false,
                    requiresPrompt: true,
                    risk: 'critical',
                    isProtectedOperation: true,
                    reason: 'Deleting files outside workspace requires explicit confirmation',
                };
            }
            if (this.permissionLevel === 'full') {
                return { allowed: true, requiresPrompt: false, risk: 'medium' };
            }
            return {
                allowed: false,
                requiresPrompt: true,
                risk: 'medium',
                reason: 'File deletion requires confirmation',
            };
        }
        return { allowed: false, requiresPrompt: true, risk: 'medium' };
    }
    checkShell(request) {
        const cmd = request.target.trim();
        // PROTECTED OPERATIONS SAFEGUARD:
        // Even in FULL mode, dangerous destructive commands ALWAYS require explicit authorization or are denied by policy!
        const protectedCheck = this.isProtectedCommand(cmd);
        if (protectedCheck.isProtected) {
            this.eventBus?.emit({
                id: crypto.randomUUID(),
                type: 'unsafe_command_blocked',
                sessionId: 'current',
                timestamp: Date.now(),
                command: cmd,
                reason: protectedCheck.reason || 'Protected command detected',
            });
            const pol = this.policy.shell.privileged;
            if (pol === 'deny') {
                return {
                    allowed: false,
                    requiresPrompt: false,
                    risk: 'critical',
                    isProtectedOperation: true,
                    reason: `Dangerous shell command denied by policy: ${protectedCheck.reason}`,
                };
            }
            return {
                allowed: false,
                requiresPrompt: true,
                risk: 'critical',
                isProtectedOperation: true,
                reason: `Protected high-risk operation (${protectedCheck.reason}) strictly requires explicit user confirmation.`,
            };
        }
        // In FULL mode: non-protected shell commands execute automatically
        if (this.permissionLevel === 'full') {
            return { allowed: true, requiresPrompt: false, risk: 'medium' };
        }
        // In ASK mode: every shell command prompts
        if (this.permissionLevel === 'ask') {
            return {
                allowed: false,
                requiresPrompt: true,
                risk: 'medium',
                reason: 'Shell execution requires confirmation in ASK mode',
            };
        }
        // In AUTO mode: safe read-only commands execute automatically; others prompt
        const firstWord = cmd.split(' ')[0];
        const isKnownSafe = this.safeShellCommands.has(firstWord) || this.safeShellCommands.has(cmd);
        const hasChainOperators = cmd.includes('&&') || cmd.includes(';') || cmd.includes('|') || cmd.includes('`') || cmd.includes('$(');
        if (isKnownSafe && !hasChainOperators) {
            return { allowed: true, requiresPrompt: false, risk: 'low' };
        }
        return {
            allowed: false,
            requiresPrompt: true,
            risk: 'medium',
            reason: 'Non-trivial shell command requires confirmation in AUTO mode',
        };
    }
    checkGit(request) {
        const act = request.action.toLowerCase();
        const isReadOnly = act === 'git_status' || act === 'git_diff' || act === 'git_log' || act === 'git_branch' || act === 'git_conflicts';
        if (isReadOnly) {
            return { allowed: true, requiresPrompt: false, risk: 'low' };
        }
        // Check for destructive git commands
        const isDestructive = act.includes('reset_hard') || act.includes('clean') || act.includes('force_push') || act.includes('branch_delete');
        if (isDestructive) {
            return {
                allowed: false,
                requiresPrompt: true,
                risk: 'critical',
                isProtectedOperation: true,
                reason: 'Destructive Git operation requires explicit user authorization',
            };
        }
        if (this.permissionLevel === 'full') {
            return { allowed: true, requiresPrompt: false, risk: 'medium' };
        }
        if (this.permissionLevel === 'ask') {
            return { allowed: false, requiresPrompt: true, risk: 'medium', reason: 'Git mutation requires confirmation in ASK mode' };
        }
        return { allowed: true, requiresPrompt: false, risk: 'medium' };
    }
    checkNetwork(request) {
        const domain = request.target;
        if (this.policy.network.allowed_domains.includes(domain)) {
            return { allowed: true, requiresPrompt: false, risk: 'low' };
        }
        if (this.permissionLevel === 'full') {
            return { allowed: true, requiresPrompt: false, risk: 'low' };
        }
        const pol = this.policy.network.default;
        if (pol === 'allow')
            return { allowed: true, requiresPrompt: false, risk: 'medium' };
        if (pol === 'deny')
            return { allowed: false, requiresPrompt: false, risk: 'medium', reason: 'Network access denied by policy' };
        return { allowed: false, requiresPrompt: true, risk: 'medium' };
    }
    checkMcp(request) {
        if (this.permissionLevel === 'full') {
            return { allowed: true, requiresPrompt: false, risk: 'low' };
        }
        return {
            allowed: false,
            requiresPrompt: true,
            risk: request.risk || 'medium',
            reason: `MCP Tool "${request.action}" requires confirmation`,
        };
    }
    emitBlockedEvents(request, reason) {
        this.eventBus?.emit({
            id: crypto.randomUUID(),
            type: 'permission_denied',
            sessionId: 'current',
            timestamp: Date.now(),
            permissionId: request.id,
            reason,
        });
        this.eventBus?.emit({
            id: crypto.randomUUID(),
            type: 'security_blocked',
            sessionId: 'current',
            timestamp: Date.now(),
            action: request.action,
            target: request.target,
            reason,
        });
    }
    loadPersistentGrants() {
        try {
            const projPath = path.join(this.workspaceRoot, '.berkelium', 'permissions.json');
            if (fs.existsSync(projPath)) {
                const data = JSON.parse(fs.readFileSync(projPath, 'utf-8'));
                if (Array.isArray(data)) {
                    for (const g of data) {
                        this.granularGrants.set(g.id, g);
                    }
                }
            }
        }
        catch {
            // Ignore
        }
        try {
            const globalPath = path.join(os.homedir(), '.berkelium', 'permissions.json');
            if (fs.existsSync(globalPath)) {
                const data = JSON.parse(fs.readFileSync(globalPath, 'utf-8'));
                if (Array.isArray(data)) {
                    for (const g of data) {
                        this.granularGrants.set(g.id, g);
                    }
                }
            }
        }
        catch {
            // Ignore
        }
    }
    saveProjectGrant(grant) {
        try {
            const dir = path.join(this.workspaceRoot, '.berkelium');
            if (!fs.existsSync(dir))
                fs.mkdirSync(dir, { recursive: true });
            const projPath = path.join(dir, 'permissions.json');
            const existing = fs.existsSync(projPath) ? JSON.parse(fs.readFileSync(projPath, 'utf-8')) : [];
            existing.push(grant);
            fs.writeFileSync(projPath, JSON.stringify(existing, null, 2), 'utf-8');
        }
        catch {
            // Ignore
        }
    }
    savePermanentGrant(grant) {
        try {
            const dir = path.join(os.homedir(), '.berkelium');
            if (!fs.existsSync(dir))
                fs.mkdirSync(dir, { recursive: true });
            const globalPath = path.join(dir, 'permissions.json');
            const existing = fs.existsSync(globalPath) ? JSON.parse(fs.readFileSync(globalPath, 'utf-8')) : [];
            existing.push(grant);
            fs.writeFileSync(globalPath, JSON.stringify(existing, null, 2), 'utf-8');
        }
        catch {
            // Ignore
        }
    }
    persistAllGrants() {
        const projectGrants = Array.from(this.granularGrants.values()).filter((g) => g.scope === 'project');
        const permanentGrants = Array.from(this.granularGrants.values()).filter((g) => g.scope === 'permanent');
        try {
            const projDir = path.join(this.workspaceRoot, '.berkelium');
            if (fs.existsSync(projDir)) {
                fs.writeFileSync(path.join(projDir, 'permissions.json'), JSON.stringify(projectGrants, null, 2), 'utf-8');
            }
        }
        catch {
            // Ignore
        }
        try {
            const globalDir = path.join(os.homedir(), '.berkelium');
            if (fs.existsSync(globalDir)) {
                fs.writeFileSync(path.join(globalDir, 'permissions.json'), JSON.stringify(permanentGrants, null, 2), 'utf-8');
            }
        }
        catch {
            // Ignore
        }
    }
}
//# sourceMappingURL=engine.js.map