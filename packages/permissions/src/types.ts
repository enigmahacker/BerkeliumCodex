export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type PermissionDecision = 'allow' | 'ask' | 'deny';

export type PermissionLevel = 'ask' | 'auto' | 'full';

export type GranularCapability =
  | 'filesystem.read'
  | 'filesystem.write'
  | 'filesystem.delete'
  | 'shell.execute'
  | 'git.read'
  | 'git.write'
  | 'network.access'
  | 'process.spawn'
  | 'process.kill'
  | 'package.install'
  | 'credential.access'
  | 'camera.access'
  | 'microphone.access'
  | 'screen.access'
  | 'cloud.access';

export type PermissionScope = 'once' | 'session' | 'project' | 'permanent';

export interface GranularGrant {
  id: string;
  capability: GranularCapability;
  targetPattern?: string;
  scope: PermissionScope;
  grantedAt: number;
  expiresAt?: number;
}

export interface PermissionRequest {
  id: string;
  category: 'filesystem' | 'shell' | 'git' | 'diagnostics' | 'web' | 'network' | 'mcp' | 'custom';
  action: string;
  target: string;
  risk: RiskLevel;
  description: string;
  capability?: GranularCapability;
  isProtectedOperation?: boolean;
  metadata?: Record<string, unknown>;
}

export interface PermissionCheckResult {
  allowed: boolean;
  requiresPrompt: boolean;
  reason?: string;
  risk: RiskLevel;
  isProtectedOperation?: boolean;
}

export type PermissionPromptResponse =
  | 'allow'
  | 'deny'
  | 'always_allow'
  | 'allow_once'
  | 'allow_session'
  | 'allow_project'
  | 'allow_permanent'
  | 'deny_once'
  | 'deny_session'
  | 'deny_permanent'
  | 'show_details';

export type PermissionPromptHandler = (
  request: PermissionRequest
) => Promise<PermissionPromptResponse>;
