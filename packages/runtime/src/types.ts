/**
 * @berkelium/runtime — Core Type Definitions
 *
 * The runtime abstraction layer provides a unified interface for local model
 * management and inference. Every runtime adapter (MLX, GGUF, CPU) implements
 * the RuntimeAdapter interface, enabling the model router to treat all
 * inference backends identically.
 *
 * This is the key architectural boundary that makes Berkelium provider-neutral
 * at the inference layer, not just the cloud API layer.
 */

// ── Model Capabilities ──────────────────────────────────────────────────

export type ModelCapability =
  | 'chat'
  | 'code'
  | 'reasoning'
  | 'vision'
  | 'tool_calling'
  | 'structured_output'
  | 'embeddings'
  | 'long_context'
  | 'streaming';

export type RuntimeType = 'mlx' | 'gguf' | 'cpu' | 'cloud';
export type ModelSource = 'local' | 'cloud' | 'registry';
export type ModelStatus = 'ready' | 'loading' | 'downloading' | 'offline' | 'error' | 'unloaded';

// ── Model Descriptor ─────────────────────────────────────────────────────

export interface HardwareRequirements {
  /** Minimum RAM in bytes to load the model */
  min_memory_bytes: number;
  /** Recommended RAM in bytes for optimal performance */
  recommended_memory_bytes: number;
  /** Whether GPU acceleration is required */
  gpu_required: boolean;
  /** Minimum GPU memory in bytes */
  min_gpu_memory_bytes?: number;
  /** Compatible runtime types */
  compatible_runtimes: RuntimeType[];
}

export interface ModelDescriptor {
  /** Unique model identifier (e.g. 'qwen3-coder:30b') */
  id: string;
  /** Human-readable model name */
  name: string;
  /** Runtime type for inference */
  runtime: RuntimeType;
  /** Where the model lives */
  source: ModelSource;
  /** Model architecture family (e.g. 'qwen', 'llama', 'mistral') */
  architecture: string;
  /** Parameter count as string (e.g. '30B', '7B') */
  parameters: string;
  /** Parameter count as number */
  parameter_count?: number;
  /** Quantization level (e.g. '4bit', 'q4_K_M', 'fp16') */
  quantization?: string;
  /** Maximum context length in tokens */
  context_length: number;
  /** Supported capabilities */
  capabilities: ModelCapability[];
  /** Hardware requirements for loading */
  hardware_requirements: HardwareRequirements;
  /** Local file path (for local models) */
  file_path?: string;
  /** File size in bytes */
  file_size_bytes?: number;
  /** Registry URL (for remote models) */
  registry_url?: string;
  /** SHA256 checksum of model files */
  checksum?: string;
  /** Model version */
  version?: string;
  /** License information */
  license?: string;
  /** Model family or series */
  family?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ── Inference Types ──────────────────────────────────────────────────────

export interface GenerateRequest {
  /** Request ID for cancellation */
  request_id: string;
  /** Input prompt */
  prompt: string;
  /** Maximum tokens to generate */
  max_tokens?: number;
  /** Temperature for sampling */
  temperature?: number;
  /** Top-p nucleus sampling */
  top_p?: number;
  /** Stop sequences */
  stop?: string[];
  /** Abort signal */
  signal?: AbortSignal;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown> | string;
  }>;
}

export interface ChatOptions {
  /** Request ID for cancellation */
  request_id: string;
  /** Model ID to use */
  model: string;
  /** System prompt */
  system_prompt?: string;
  /** Max tokens */
  max_tokens?: number;
  /** Temperature */
  temperature?: number;
  /** Tool definitions */
  tools?: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
  /** Abort signal */
  signal?: AbortSignal;
}

export interface GenerateResponse {
  text: string;
  tokens_generated: number;
  tokens_prompt: number;
  duration_ms: number;
  model: string;
}

export interface StreamChunk {
  type: 'token' | 'reasoning' | 'tool_call' | 'usage' | 'finish' | 'error';
  text?: string;
  reasoning?: string;
  tool_call?: {
    id?: string;
    name?: string;
    arguments_delta?: string;
  };
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason?: string;
  error?: string;
}

export interface TokenizeResult {
  tokens: number[];
  count: number;
}

// ── Runtime Status ───────────────────────────────────────────────────────

export interface RuntimeHealth {
  status: 'ready' | 'loading' | 'error' | 'unavailable';
  runtime: RuntimeType;
  message?: string;
  models_loaded: number;
  memory_used_bytes?: number;
  uptime_ms?: number;
}

export interface RuntimeMetadata {
  id: string;
  name: string;
  version: string;
  runtime_type: RuntimeType;
  supported_architectures: string[];
  max_context_length?: number;
  supports_streaming: boolean;
  supports_tool_calling: boolean;
  supports_vision: boolean;
}

export interface RuntimeCapabilities {
  streaming: boolean;
  tool_calling: boolean;
  vision: boolean;
  reasoning: boolean;
  embeddings: boolean;
  structured_output: boolean;
  concurrent_models: boolean;
  hot_swap: boolean;
}

export interface LoadedModel {
  descriptor: ModelDescriptor;
  status: ModelStatus;
  loaded_at: number;
  memory_used_bytes: number;
  requests_served: number;
  process_pid?: number;
}

// ── Runtime Adapter Interface ────────────────────────────────────────────

/**
 * The core runtime adapter contract. Every local inference backend
 * (MLX, GGUF/llama.cpp, CPU) must implement this interface.
 *
 * This is intentionally separate from the cloud Provider interface
 * because local runtimes have fundamentally different lifecycle needs
 * (load/unload, memory management, process management).
 */
export interface RuntimeAdapter {
  /** Unique runtime identifier */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** Runtime type */
  readonly type: RuntimeType;

  // ── Lifecycle ──────────────────────────────────────────────────────
  /** Load a model into the runtime */
  load(model: ModelDescriptor): Promise<void>;
  /** Unload a model from the runtime */
  unload(modelId: string): Promise<void>;

  // ── Inference ──────────────────────────────────────────────────────
  /** Generate a completion (non-streaming) */
  generate(request: GenerateRequest): Promise<GenerateResponse>;
  /** Stream a completion */
  stream(request: GenerateRequest): AsyncIterable<StreamChunk>;
  /** Chat with tool calling support */
  chat(messages: ChatMessage[], options: ChatOptions): AsyncIterable<StreamChunk>;

  // ── Utility ────────────────────────────────────────────────────────
  /** Generate embeddings */
  embed(text: string | string[]): Promise<number[][]>;
  /** Tokenize text */
  tokenize(text: string): Promise<TokenizeResult>;

  // ── Status ─────────────────────────────────────────────────────────
  /** Check runtime health */
  health(): Promise<RuntimeHealth>;
  /** Get runtime metadata */
  metadata(): RuntimeMetadata;
  /** Get runtime capabilities */
  capabilities(): RuntimeCapabilities;
  /** Cancel an in-flight request */
  cancel(requestId: string): void;
  /** List currently loaded models */
  listLoaded(): LoadedModel[];
}

// ── Hardware Detection ───────────────────────────────────────────────────

export type AppleSiliconChip = 'M1' | 'M2' | 'M3' | 'M4' | 'M1 Pro' | 'M1 Max' | 'M1 Ultra'
  | 'M2 Pro' | 'M2 Max' | 'M2 Ultra' | 'M3 Pro' | 'M3 Max' | 'M3 Ultra'
  | 'M4 Pro' | 'M4 Max' | 'M4 Ultra' | 'unknown';

export interface HardwareInfo {
  /** Chip model */
  chip: AppleSiliconChip;
  /** Whether this is Apple Silicon */
  is_apple_silicon: boolean;
  /** Total system memory in bytes */
  total_memory_bytes: number;
  /** Available memory in bytes */
  available_memory_bytes: number;
  /** Number of CPU cores */
  cpu_cores: number;
  /** Number of performance cores */
  performance_cores: number;
  /** Number of efficiency cores */
  efficiency_cores: number;
  /** Number of GPU cores */
  gpu_cores: number;
  /** Whether Neural Engine is available */
  neural_engine: boolean;
  /** OS version */
  os_version: string;
  /** Architecture */
  arch: string;
}

export interface MemoryBudget {
  /** Total available for models */
  total_available_bytes: number;
  /** Reserved for system */
  system_reserved_bytes: number;
  /** Reserved for agent runtime */
  agent_reserved_bytes: number;
  /** Maximum model size that can be loaded */
  max_model_bytes: number;
  /** Currently used by loaded models */
  currently_used_bytes: number;
  /** Remaining budget */
  remaining_bytes: number;
}

// ── Model Manager Types ──────────────────────────────────────────────────

export interface PullProgress {
  model_id: string;
  status: 'resolving' | 'downloading' | 'verifying' | 'extracting' | 'complete' | 'error';
  bytes_downloaded: number;
  bytes_total: number;
  percent: number;
  speed_bps: number;
  eta_seconds: number;
  message?: string;
}

export type PullProgressCallback = (progress: PullProgress) => void;

export interface ModelRegistryEntry {
  id: string;
  name: string;
  description?: string;
  architecture: string;
  parameters: string;
  quantizations: string[];
  context_length: number;
  capabilities: ModelCapability[];
  license?: string;
  source_url: string;
  versions: Array<{
    version: string;
    checksum: string;
    file_size_bytes: number;
    quantization: string;
    runtime_compatibility: RuntimeType[];
  }>;
}

export interface ModelStoreMeta {
  models: ModelDescriptor[];
  last_updated: number;
  storage_used_bytes: number;
}
