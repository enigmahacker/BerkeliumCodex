export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
  reasoning?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown> | string;
}

export interface ProviderCapabilities {
  streaming: boolean;
  tool_calling: boolean;
  vision: boolean;
  reasoning: boolean;
  structured_output: boolean;
  embeddings: boolean;
  model_discovery: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  context_length: number;
  capabilities: Partial<ProviderCapabilities>;
  description?: string;
}

export interface TokenUsageInfo {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  reasoningTokens?: number;
}

export type ChunkType = 'token' | 'reasoning' | 'tool_call_start' | 'tool_call_delta' | 'tool_call_end' | 'usage' | 'finish';

export interface NormalizedChunk {
  type: ChunkType;
  text?: string;
  reasoning?: string;
  toolCall?: {
    id?: string;
    index?: number;
    name?: string;
    argumentsDelta?: string;
  };
  usage?: TokenUsageInfo;
  finishReason?: string;
}

export interface NormalizedResponse {
  text: string;
  reasoning?: string;
  toolCalls: ToolCall[];
  usage: TokenUsageInfo;
  finishReason: string;
  model: string;
  provider: string;
  raw?: unknown;
}

export interface ProviderRequestOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
  toolChoice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
  signal?: AbortSignal;
  systemPrompt?: string;
}

export interface Provider {
  readonly id: string;
  readonly name: string;
  capabilities(): ProviderCapabilities;
  isAvailable(): Promise<boolean>;
  listModels(): Promise<ModelInfo[]>;
  stream(messages: Message[], options: ProviderRequestOptions): AsyncIterable<NormalizedChunk>;
  generate(messages: Message[], options: ProviderRequestOptions): Promise<NormalizedResponse>;
}
