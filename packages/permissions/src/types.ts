export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type PermissionDecision = 'allow' | 'ask' | 'deny';

export interface PermissionRequest {
  id: string;
  category: 'filesystem' | 'shell' | 'git' | 'diagnostics' | 'web' | 'network' | 'mcp' | 'custom';
  action: string;
  target: string;
  risk: RiskLevel;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface PermissionCheckResult {
  allowed: boolean;
  requiresPrompt: boolean;
  reason?: string;
  risk: RiskLevel;
}

export type PermissionPromptHandler = (
  request: PermissionRequest
) => Promise<'allow' | 'deny' | 'always_allow'>;
