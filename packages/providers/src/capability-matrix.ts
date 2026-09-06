/**
 * @berkelium/providers — Capability Matrix
 *
 * Maps model IDs and architectures to supported capabilities.
 * Used by the model router to select the optimal model for a given task
 * (e.g. requires tool calling, vision, complex reasoning, or long context).
 */

export type ModelCapabilityType =
  | 'chat'
  | 'code'
  | 'reasoning'
  | 'vision'
  | 'tool_calling'
  | 'structured_output'
  | 'embeddings'
  | 'long_context'
  | 'streaming';

export interface ModelCapabilityProfile {
  id: string;
  name: string;
  contextWindow: number;
  capabilities: ModelCapabilityType[];
  speedTier: 'ultra-fast' | 'fast' | 'balanced' | 'thoughtful';
  recommendedUse: string;
}

const KNOWN_MODELS: Record<string, ModelCapabilityProfile> = {
  // Google Gemini (Google AI Studio Permanent Free Tier & Frontier Models)
  'gemini-3-flash': {
    id: 'gemini-3-flash',
    name: 'Gemini 3 Flash',
    contextWindow: 1_048_576,
    capabilities: ['chat', 'code', 'reasoning', 'vision', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'ultra-fast',
    recommendedUse: 'Recommended default free-tier model — high-speed coding, tool orchestration & reasoning',
  },
  'gemini-3.8-flash': {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    contextWindow: 1_048_576,
    capabilities: ['chat', 'code', 'reasoning', 'vision', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'ultra-fast',
    recommendedUse: 'High-speed reasoning and deep tool automation',
  },
  'gemini-3.1-flash-lite': {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    contextWindow: 1_048_576,
    capabilities: ['chat', 'code', 'vision', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'ultra-fast',
    recommendedUse: 'Ultra-fast, high-throughput execution within free tier rate limits',
  },
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    contextWindow: 1_048_576,
    capabilities: ['chat', 'code', 'reasoning', 'vision', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'ultra-fast',
    recommendedUse: 'Permanent free tier model with integrated thinking and deliberate reasoning',
  },
  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    contextWindow: 1_048_576,
    capabilities: ['chat', 'code', 'vision', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'ultra-fast',
    recommendedUse: 'Fast multimodal generation and continuous agentic tool loop',
  },
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    contextWindow: 2_097_152,
    capabilities: ['chat', 'code', 'reasoning', 'vision', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'thoughtful',
    recommendedUse: 'Complex cross-repository refactoring and architectural planning (~50 req/day free cap)',
  },
  'gemini-3.6-flash': {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    contextWindow: 1_048_576,
    capabilities: ['chat', 'code', 'reasoning', 'vision', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'ultra-fast',
    recommendedUse: 'Default high-throughput coding and tool calling',
  },
  'text-embedding-004': {
    id: 'text-embedding-004',
    name: 'Text Embedding 004',
    contextWindow: 8_192,
    capabilities: ['embeddings'],
    speedTier: 'ultra-fast',
    recommendedUse: 'Semantic code search and RAG embeddings on permanent free tier',
  },
  'multimodal-embeddings': {
    id: 'multimodal-embeddings',
    name: 'Google Multimodal Embeddings',
    contextWindow: 8_192,
    capabilities: ['embeddings', 'vision'],
    speedTier: 'ultra-fast',
    recommendedUse: 'Vector search across code, docs, and visual assets',
  },

  // Anthropic Claude
  'anthropic/claude-3.7-sonnet': {
    id: 'anthropic/claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet',
    contextWindow: 200_000,
    capabilities: ['chat', 'code', 'reasoning', 'vision', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'thoughtful',
    recommendedUse: 'Flagship hybrid reasoning and agentic software engineering',
  },
  'anthropic/claude-3.7-sonnet:thinking': {
    id: 'anthropic/claude-3.7-sonnet:thinking',
    name: 'Claude 3.7 Sonnet (Thinking)',
    contextWindow: 200_000,
    capabilities: ['chat', 'code', 'reasoning', 'vision', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'thoughtful',
    recommendedUse: 'Extended thinking mode for complex architectures, formal verification, and deep debugging',
  },
  'anthropic/claude-3.5-sonnet': {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    contextWindow: 200_000,
    capabilities: ['chat', 'code', 'reasoning', 'vision', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'balanced',
    recommendedUse: 'Industry standard frontier coding and tool execution',
  },
  'anthropic/claude-3.5-haiku': {
    id: 'anthropic/claude-3.5-haiku',
    name: 'Claude 3.5 Haiku',
    contextWindow: 200_000,
    capabilities: ['chat', 'code', 'vision', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'ultra-fast',
    recommendedUse: 'Ultra-fast, cost-effective coding, triage, and rapid terminal execution',
  },
  'anthropic/claude-3-opus': {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    contextWindow: 200_000,
    capabilities: ['chat', 'code', 'reasoning', 'vision', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'thoughtful',
    recommendedUse: 'Deep analysis and architectural synthesis',
  },
  'anthropic/claude-sonnet-4-5': {
    id: 'anthropic/claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    contextWindow: 200_000,
    capabilities: ['chat', 'code', 'reasoning', 'vision', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'balanced',
    recommendedUse: 'Next-generation hybrid reasoning & coding',
  },
  'anthropic/claude-opus-4-5': {
    id: 'anthropic/claude-opus-4-5',
    name: 'Claude Opus 4.5',
    contextWindow: 200_000,
    capabilities: ['chat', 'code', 'reasoning', 'vision', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'thoughtful',
    recommendedUse: 'Pinnacle frontier intelligence for difficult engineering tasks',
  },

  // OpenAI
  'openai/gpt-4o': {
    id: 'openai/gpt-4o',
    name: 'OpenAI GPT-4o',
    contextWindow: 128_000,
    capabilities: ['chat', 'code', 'vision', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Multimodal flagship with high throughput and dependable tool execution',
  },
  'openai/gpt-4o-mini': {
    id: 'openai/gpt-4o-mini',
    name: 'OpenAI GPT-4o Mini',
    contextWindow: 128_000,
    capabilities: ['chat', 'code', 'vision', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'ultra-fast',
    recommendedUse: 'Ultra-fast, affordable multimodal workhorse for continuous agent loops',
  },
  'openai/o3-mini': {
    id: 'openai/o3-mini',
    name: 'OpenAI o3-mini',
    contextWindow: 200_000,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'High-speed frontier reasoning optimized for coding, mathematics, and STEM',
  },
  'openai/o3': {
    id: 'openai/o3',
    name: 'OpenAI o3',
    contextWindow: 200_000,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'thoughtful',
    recommendedUse: 'Frontier reasoning powerhouse for complex algorithmic tasks and architecture',
  },
  'openai/o1': {
    id: 'openai/o1',
    name: 'OpenAI o1',
    contextWindow: 200_000,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'thoughtful',
    recommendedUse: 'Deliberate reasoning for hard engineering and scientific problems',
  },
  'openai/o1-mini': {
    id: 'openai/o1-mini',
    name: 'OpenAI o1-mini',
    contextWindow: 128_000,
    capabilities: ['chat', 'code', 'reasoning', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Fast reasoning model for STEM and mathematical deduction',
  },
  'openai/chatgpt-4o-latest': {
    id: 'openai/chatgpt-4o-latest',
    name: 'ChatGPT-4o Latest',
    contextWindow: 128_000,
    capabilities: ['chat', 'code', 'vision', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Dynamic, continuously updated research checkpoint',
  },

  // DeepSeek
  'deepseek/deepseek-chat': {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek Chat (V3)',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Agentic coding, bug fixing, and test authoring',
  },
  'deepseek/deepseek-r1': {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    contextWindow: 163_840,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'thoughtful',
    recommendedUse: 'Deep mathematical, algorithmic, and architectural reasoning',
  },
  'deepseek-ai/deepseek-r1': {
    id: 'deepseek-ai/deepseek-r1',
    name: 'DeepSeek R1 (NVIDIA NIM)',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'thoughtful',
    recommendedUse: 'DeepSeek R1 frontier reasoning accelerated on NVIDIA NIM',
  },
  'deepseek-ai/deepseek-v3': {
    id: 'deepseek-ai/deepseek-v3',
    name: 'DeepSeek V3 (NVIDIA NIM)',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'DeepSeek V3 671B MoE flagship coding on NVIDIA NIM',
  },
  'deepseek-coder-v2': {
    id: 'deepseek-coder-v2',
    name: 'DeepSeek Coder V2',
    contextWindow: 65_536,
    capabilities: ['chat', 'code', 'tool_calling', 'structured_output', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Local workstation coding via LM Studio or Ollama',
  },

  // Meta Llama
  'meta-llama/Llama-3.3-70B-Instruct': {
    id: 'meta-llama/Llama-3.3-70B-Instruct',
    name: 'Llama 3.3 70B Instruct',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'balanced',
    recommendedUse: 'General-purpose agentic coding and file editing',
  },
  'meta/llama-3.3-70b-instruct': {
    id: 'meta/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct (NVIDIA NIM)',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Meta latest 70B instruction model on NVIDIA NIM',
  },
  'meta/llama-3.1-405b-instruct': {
    id: 'meta/llama-3.1-405b-instruct',
    name: 'Llama 3.1 405B Instruct (NVIDIA NIM)',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'balanced',
    recommendedUse: 'Meta 405B premier open frontier model on NVIDIA NIM',
  },
  'llama-3.3-70b-versatile': {
    id: 'llama-3.3-70b-versatile',
    name: 'Groq Llama 3.3 70B Versatile',
    contextWindow: 128_000,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'ultra-fast',
    recommendedUse: 'Ultra-low-latency code editing and verification on Groq LPU',
  },
  'llama-3.1-8b-instant': {
    id: 'llama-3.1-8b-instant',
    name: 'Groq Llama 3.1 8B Instant',
    contextWindow: 128_000,
    capabilities: ['chat', 'code', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'ultra-fast',
    recommendedUse: 'Sub-100ms ultra-fast terminal interactions and diffs on Groq LPU',
  },
  'llama-3.2-11b-vision-preview': {
    id: 'llama-3.2-11b-vision-preview',
    name: 'Groq Llama 3.2 11B Vision',
    contextWindow: 128_000,
    capabilities: ['chat', 'code', 'vision', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'ultra-fast',
    recommendedUse: 'High-speed multimodal image and document reasoning on Groq LPU',
  },
  'qwen-2.5-32b': {
    id: 'qwen-2.5-32b',
    name: 'Qwen 2.5 32B (Groq)',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'ultra-fast',
    recommendedUse: 'Alibaba code & STEM intelligence on Groq LPU',
  },
  'qwen-2.5-72b': {
    id: 'qwen-2.5-72b',
    name: 'Qwen 2.5 72B (Groq)',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'ultra-fast',
    recommendedUse: 'Flagship open model reasoning and code editing on Groq LPU',
  },
  'gemma2-9b-it': {
    id: 'gemma2-9b-it',
    name: 'Gemma 2 9B IT (Groq)',
    contextWindow: 8_192,
    capabilities: ['chat', 'code', 'tool_calling', 'streaming'],
    speedTier: 'ultra-fast',
    recommendedUse: 'Ultra-fast open weights assistant on Groq LPU',
  },
  'gemma-2-27b-it': {
    id: 'gemma-2-27b-it',
    name: 'Gemma 2 27B IT (Groq)',
    contextWindow: 8_192,
    capabilities: ['chat', 'code', 'tool_calling', 'streaming'],
    speedTier: 'ultra-fast',
    recommendedUse: 'High-fidelity Google open model on Groq LPU',
  },

  // OpenRouter Free Community Endpoints (:free)
  'meta-llama/llama-4-scout:free': {
    id: 'meta-llama/llama-4-scout:free',
    name: 'Llama 4 Scout (Free)',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'vision', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Meta Llama 4 Scout open MoE via free community endpoint',
  },
  'meta-llama/llama-4-maverick:free': {
    id: 'meta-llama/llama-4-maverick:free',
    name: 'Llama 4 Maverick (Free)',
    contextWindow: 1_048_576,
    capabilities: ['chat', 'code', 'vision', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'balanced',
    recommendedUse: 'Meta Llama 4 Maverick 1M-context flagship via free community endpoint',
  },
  'meta-llama/llama-3.3-70b-instruct:free': {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B Instruct (Free)',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'balanced',
    recommendedUse: 'General-purpose agentic coding via subsidized free endpoint',
  },
  'meta-llama/llama-3.1-8b-instruct:free': {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    name: 'Llama 3.1 8B Instruct (Free)',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'ultra-fast',
    recommendedUse: 'Fast command edits and triage via subsidized free endpoint',
  },
  'minimax/minimax-m3:free': {
    id: 'minimax/minimax-m3:free',
    name: 'MiniMax M3 (Free)',
    contextWindow: 1_048_576,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'balanced',
    recommendedUse: '1M-token context window frontier reasoning via free endpoint',
  },
  'nvidia/nemotron-3.5-lightning:free': {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'Nemotron 3.5 Lightning (Free)',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'NVIDIA aligned reasoning via OpenRouter free endpoint',
  },
  'poolside/laguna-s-2.1:free': {
    id: 'poolside/laguna-s-2.1:free',
    name: 'Laguna S 2.1 (Free)',
    contextWindow: 65_536,
    capabilities: ['chat', 'code', 'tool_calling', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Poolside specialized code generation engine via free endpoint',
  },
  'google/gemma-3-27b-it:free': {
    id: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B IT (Free)',
    contextWindow: 32_768,
    capabilities: ['chat', 'code', 'vision', 'tool_calling', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Google multimodal open weights via OpenRouter free endpoint',
  },
  'qwen/qwen-2.5-72b-instruct:free': {
    id: 'qwen/qwen-2.5-72b-instruct:free',
    name: 'Qwen 2.5 72B Instruct (Free)',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'balanced',
    recommendedUse: 'Alibaba flagship 72B open model via free endpoint',
  },
  'mistralai/mistral-7b-instruct:free': {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B Instruct (Free)',
    contextWindow: 32_768,
    capabilities: ['chat', 'code', 'tool_calling', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Mistral 7B open model via OpenRouter free endpoint',
  },

  // NVIDIA NIM Catalog (1,000 Free Credits)
  'nvidia/nemotron-3.5-lightning-30b-a3b': {
    id: 'nvidia/nemotron-3.5-lightning-30b-a3b',
    name: 'Nemotron 3.5 Lightning 30B (NVIDIA NIM)',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Enterprise-grade code intelligence on NVIDIA NIM',
  },
  'nvidia/nemotron-3-embed-1b': {
    id: 'nvidia/nemotron-3-embed-1b',
    name: 'Nemotron 3 Embed 1B (NVIDIA NIM)',
    contextWindow: 8_192,
    capabilities: ['embeddings'],
    speedTier: 'ultra-fast',
    recommendedUse: 'Dense code & doc embeddings on NVIDIA NIM',
  },
  'nvidia/nemotron-ocr-v2': {
    id: 'nvidia/nemotron-ocr-v2',
    name: 'Nemotron OCR v2 (NVIDIA NIM)',
    contextWindow: 16_384,
    capabilities: ['vision'],
    speedTier: 'fast',
    recommendedUse: 'Visual text & OCR extraction on NVIDIA NIM',
  },
  'deepseek-ai/deepseek-v4-pro-0813': {
    id: 'deepseek-ai/deepseek-v4-pro-0813',
    name: 'DeepSeek V4 Pro (NVIDIA NIM)',
    contextWindow: 163_840,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'thoughtful',
    recommendedUse: 'Frontier software engineering and reasoning on NVIDIA NIM',
  },
  'deepseek-ai/deepseek-v4-flash-0731': {
    id: 'deepseek-ai/deepseek-v4-flash-0731',
    name: 'DeepSeek V4 Flash (NVIDIA NIM)',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'ultra-fast',
    recommendedUse: 'High-speed reasoning checkpoint on NVIDIA NIM',
  },
  'moonshotai/kimi-k3': {
    id: 'moonshotai/kimi-k3',
    name: 'Kimi K3 (NVIDIA NIM)',
    contextWindow: 200_000,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Long-context reasoning on NVIDIA NIM',
  },
  'meta/muse-glimmer-30b': {
    id: 'meta/muse-glimmer-30b',
    name: 'Muse Glimmer 30B (NVIDIA NIM)',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'vision', 'tool_calling', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Multimodal generation and code on NVIDIA NIM',
  },
  'poolside/laguna-xs-2.1': {
    id: 'poolside/laguna-xs-2.1',
    name: 'Laguna XS 2.1 (NVIDIA NIM)',
    contextWindow: 65_536,
    capabilities: ['chat', 'code', 'tool_calling', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Compact coding model on NVIDIA NIM',
  },
  'minimax/minimax-m3': {
    id: 'minimax/minimax-m3',
    name: 'MiniMax M3 (NVIDIA NIM)',
    contextWindow: 1_048_576,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'balanced',
    recommendedUse: '1M context reasoning on NVIDIA NIM',
  },

  // NVIDIA Aligned & Custom NIM Models
  'nvidia/llama-3.1-nemotron-70b-instruct': {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    name: 'Llama 3.1 Nemotron 70B (NVIDIA NIM)',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'balanced',
    recommendedUse: 'NVIDIA custom aligned high-accuracy enterprise reasoning model',
  },
  'nvidia/llama-3.1-nemotron-51b-instruct': {
    id: 'nvidia/llama-3.1-nemotron-51b-instruct',
    name: 'Llama 3.1 Nemotron 51B (NVIDIA NIM)',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'NVIDIA 51B ultra-efficient aligned model for coding and agent loops',
  },
  'qwen/qwen2.5-coder-32b-instruct': {
    id: 'qwen/qwen2.5-coder-32b-instruct',
    name: 'Qwen 2.5 Coder 32B (NVIDIA NIM)',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Qwen coding powerhouse on NVIDIA NIM',
  },
  'mistralai/mistral-large-2-instruct': {
    id: 'mistralai/mistral-large-2-instruct',
    name: 'Mistral Large 2 (NVIDIA NIM)',
    contextWindow: 128_000,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Mistral flagship frontier model on NVIDIA NIM',
  },
  'mistralai/codestral-22b-instruct-v0.1': {
    id: 'mistralai/codestral-22b-instruct-v0.1',
    name: 'Codestral 22B (NVIDIA NIM)',
    contextWindow: 32_768,
    capabilities: ['chat', 'code', 'tool_calling', 'structured_output', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Mistral dedicated software engineering and code generation on NVIDIA NIM',
  },

  // Hugging Face Serverless Free Tier (<10B)
  'meta-llama/Llama-3.1-8B-Instruct': {
    id: 'meta-llama/Llama-3.1-8B-Instruct',
    name: 'Llama 3.1 8B Instruct (HF Serverless)',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'tool_calling', 'structured_output', 'long_context', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Meta open weights on Hugging Face Serverless Free Tier',
  },
  'google/gemma-2-2b-it': {
    id: 'google/gemma-2-2b-it',
    name: 'Gemma 2 2B IT (HF Serverless)',
    contextWindow: 8_192,
    capabilities: ['chat', 'code', 'tool_calling', 'streaming'],
    speedTier: 'ultra-fast',
    recommendedUse: 'Google compact assistant on HF Serverless Free Tier',
  },
  'google/gemma-2-9b-it': {
    id: 'google/gemma-2-9b-it',
    name: 'Gemma 2 9B IT (HF Serverless)',
    contextWindow: 8_192,
    capabilities: ['chat', 'code', 'tool_calling', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Google 9B open model on HF Serverless Free Tier',
  },
  'mistralai/Mistral-7B-Instruct-v0.3': {
    id: 'mistralai/Mistral-7B-Instruct-v0.3',
    name: 'Mistral 7B Instruct v0.3 (HF Serverless)',
    contextWindow: 32_768,
    capabilities: ['chat', 'code', 'tool_calling', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Mistral 7B tool calling model on HF Serverless Free Tier',
  },
  'Qwen/Qwen2.5-7B-Instruct': {
    id: 'Qwen/Qwen2.5-7B-Instruct',
    name: 'Qwen 2.5 7B Instruct (HF Serverless)',
    contextWindow: 32_768,
    capabilities: ['chat', 'code', 'tool_calling', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Alibaba open model on HF Serverless Free Tier',
  },
  'Qwen/Qwen2.5-Coder-7B': {
    id: 'Qwen/Qwen2.5-Coder-7B',
    name: 'Qwen 2.5 Coder 7B (HF Serverless)',
    contextWindow: 32_768,
    capabilities: ['chat', 'code', 'tool_calling', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Alibaba dedicated code model on HF Serverless Free Tier',
  },
  'BAAI/bge-large-en-v1.5': {
    id: 'BAAI/bge-large-en-v1.5',
    name: 'BGE Large EN v1.5 (HF)',
    contextWindow: 512,
    capabilities: ['embeddings'],
    speedTier: 'ultra-fast',
    recommendedUse: 'Dense embeddings for repository search on HF Serverless',
  },
  'black-forest-labs/FLUX.1-schnell': {
    id: 'black-forest-labs/FLUX.1-schnell',
    name: 'FLUX.1 Schnell (HF)',
    contextWindow: 512,
    capabilities: ['vision'],
    speedTier: 'fast',
    recommendedUse: 'High-speed image generation on HF Serverless Free Tier',
  },

  // Local / Open Models
  'qwen3-coder:30b': {
    id: 'qwen3-coder:30b',
    name: 'Qwen3 Coder 30B',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'reasoning', 'tool_calling', 'structured_output', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Apple Silicon MLX local coding agent',
  },
  'qwen2.5:14b-instruct-q4_K_M': {
    id: 'qwen2.5:14b-instruct-q4_K_M',
    name: 'Qwen 2.5 14B Instruct',
    contextWindow: 32_768,
    capabilities: ['chat', 'code', 'tool_calling', 'streaming'],
    speedTier: 'fast',
    recommendedUse: 'Local Ollama coding assistant',
  },
  'phi-4-mini': {
    id: 'phi-4-mini',
    name: 'Phi-4 Mini',
    contextWindow: 131_072,
    capabilities: ['chat', 'code', 'tool_calling', 'streaming'],
    speedTier: 'ultra-fast',
    recommendedUse: 'Compact low-resource local execution',
  },
};

export class CapabilityMatrix {
  private profiles: Map<string, ModelCapabilityProfile> = new Map();

  constructor() {
    for (const [id, profile] of Object.entries(KNOWN_MODELS)) {
      this.profiles.set(id.toLowerCase(), profile);
    }
  }

  public registerProfile(profile: ModelCapabilityProfile): void {
    this.profiles.set(profile.id.toLowerCase(), profile);
  }

  public getProfile(modelId: string): ModelCapabilityProfile | undefined {
    const lower = modelId.toLowerCase();
    if (this.profiles.has(lower)) {
      return this.profiles.get(lower);
    }

    // Try finding by suffix (e.g. 'gemini-3.6-flash' matches 'google/gemini-3.6-flash')
    for (const [key, profile] of this.profiles.entries()) {
      if (lower.endsWith(key) || key.endsWith(lower)) {
        return profile;
      }
    }

    // Infer basic profile from name heuristics
    return {
      id: modelId,
      name: modelId,
      contextWindow: 32_768,
      capabilities: inferCapabilitiesFromName(modelId),
      speedTier: 'balanced',
      recommendedUse: 'General inference',
    };
  }

  public hasCapability(modelId: string, capability: ModelCapabilityType): boolean {
    const profile = this.getProfile(modelId);
    return profile ? profile.capabilities.includes(capability) : false;
  }

  public recommendModel(requirements: {
    code?: boolean;
    reasoning?: boolean;
    toolCalling?: boolean;
    vision?: boolean;
    longContext?: boolean;
    preferLocal?: boolean;
  }): string {
    if (requirements.preferLocal) {
      if (requirements.toolCalling || requirements.code) {
        return 'qwen3-coder:30b';
      }
      return 'phi-4-mini';
    }

    if (requirements.reasoning && !requirements.toolCalling) {
      return 'deepseek/deepseek-r1';
    }

    if (requirements.vision || requirements.longContext) {
      return 'gemini-3.6-flash';
    }

    if (requirements.code || requirements.toolCalling) {
      return 'coding'; // default configured alias
    }

    return 'gemini-3.6-flash';
  }
}

function inferCapabilitiesFromName(name: string): ModelCapabilityType[] {
  const lower = name.toLowerCase();
  const caps: ModelCapabilityType[] = ['chat', 'streaming'];

  if (
    lower.includes('code') ||
    lower.includes('coder') ||
    lower.includes('qwen') ||
    lower.includes('llama') ||
    lower.includes('codestral') ||
    lower.includes('claude') ||
    lower.includes('gpt')
  ) {
    caps.push('code');
  }
  if (
    lower.includes('r1') ||
    lower.includes('o1') ||
    lower.includes('o3') ||
    lower.includes('reason') ||
    lower.includes('pro') ||
    lower.includes('thinking') ||
    lower.includes('nemotron')
  ) {
    caps.push('reasoning');
  }
  if (
    lower.includes('flash') ||
    lower.includes('pro') ||
    lower.includes('instruct') ||
    lower.includes('v3') ||
    lower.includes('claude') ||
    lower.includes('gpt') ||
    lower.includes('nemotron')
  ) {
    caps.push('tool_calling');
    caps.push('structured_output');
  }
  if (
    lower.includes('vision') ||
    lower.includes('vl') ||
    lower.includes('gemini') ||
    lower.includes('scout') ||
    lower.includes('4o') ||
    lower.includes('claude')
  ) {
    caps.push('vision');
  }
  if (
    lower.includes('1m') ||
    lower.includes('2m') ||
    lower.includes('flash') ||
    lower.includes('pro') ||
    lower.includes('claude') ||
    lower.includes('128k') ||
    lower.includes('200k')
  ) {
    caps.push('long_context');
  }

  return caps;
}
