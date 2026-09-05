import { z } from 'zod';
import { RiskLevel } from '@berkelium/permissions';

export interface ToolMetadata {
  name: string;
  description: string;
  category: 'filesystem' | 'shell' | 'git' | 'diagnostics' | 'web' | 'mcp' | 'custom';
  risk: RiskLevel;
  requiresConfirmation?: boolean;
  network?: boolean;
  filesystem?: {
    read?: boolean;
    write?: boolean;
    delete?: boolean;
  };
}

export interface ToolContext {
  workspaceRoot: string;
  sessionId: string;
  signal?: AbortSignal;
  onOutput?: (chunk: string) => void;
}

export interface ToolExecutionResult {
  success: boolean;
  output: string;
  data?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface Tool<TParams = any> {
  readonly metadata: ToolMetadata;
  readonly schema: z.ZodType<TParams, any, any>;
  execute(args: TParams, context: ToolContext): Promise<ToolExecutionResult>;
}
