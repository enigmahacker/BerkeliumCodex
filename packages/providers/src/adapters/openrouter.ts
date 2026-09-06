import { AuthStore } from '@berkelium/auth';
import {
  Message,
  ModelInfo,
  NormalizedChunk,
  NormalizedResponse,
  Provider,
  ProviderCapabilities,
  ProviderRequestOptions,
} from '../types.js';
import { ResponseNormalizer } from '../normalizer.js';

export class OpenRouterProvider implements Provider {
  public readonly id = 'openrouter';
  public readonly name = 'OpenRouter';
  private baseUrl: string;
  private authStore: AuthStore;

  constructor(authStore: AuthStore, baseUrl = 'https://openrouter.ai/api/v1') {
    this.authStore = authStore;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  public capabilities(): ProviderCapabilities {
    return {
      streaming: true,
      tool_calling: true,
      vision: true,
      reasoning: true,
      structured_output: true,
      embeddings: false,
      model_discovery: true,
    };
  }

  public async isAvailable(): Promise<boolean> {
    const key = await this.authStore.getApiKey('openrouter');
    return Boolean(key);
  }

  public async listModels(): Promise<ModelInfo[]> {
    try {
      const apiKey = await this.authStore.getApiKey('openrouter');
      const headers: Record<string, string> = {
        'HTTP-Referer': 'https://berkelium.dev',
        'X-Title': 'Berkelium CLI',
      };
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

      const res = await fetch(`${this.baseUrl}/models`, { headers });
      if (!res.ok) return this.getDefaultModels();
      const data = (await res.json()) as any;
      if (!data.data || !Array.isArray(data.data)) return this.getDefaultModels();

      return data.data.map((m: any) => {
        const idLower = (m.id || '').toLowerCase();
        const descLower = (m.description || '').toLowerCase();
        const isReasoning =
          idLower.includes('r1') ||
          idLower.includes('reasoning') ||
          idLower.includes('o1') ||
          idLower.includes('o3') ||
          idLower.includes('thinking');
        const isVision = Boolean(
          m.architecture?.modality?.includes('image') ||
            idLower.includes('vision') ||
            idLower.includes('vl') ||
            idLower.includes('4o') ||
            idLower.includes('claude-3') ||
            idLower.includes('gemini')
        );

        return {
          id: m.id,
          name: m.name || m.id,
          provider: 'openrouter',
          context_length: m.context_length || 128000,
          description: m.description,
          capabilities: {
            streaming: true,
            tool_calling: true,
            vision: isVision,
            reasoning: isReasoning,
          },
        };
      });
    } catch {
      return this.getDefaultModels();
    }
  }

  public getDefaultModels(): ModelInfo[] {
    return [
      // ── Anthropic Claude ──────────────────────────────────────────
      {
        id: 'anthropic/claude-3.7-sonnet',
        name: 'Claude 3.7 Sonnet',
        provider: 'openrouter',
        context_length: 200000,
        capabilities: { streaming: true, tool_calling: true, vision: true, reasoning: true },
        description: 'Anthropic Claude 3.7 Sonnet — flagship hybrid reasoning and agentic software engineering',
      },
      {
        id: 'anthropic/claude-3.7-sonnet:thinking',
        name: 'Claude 3.7 Sonnet (Thinking)',
        provider: 'openrouter',
        context_length: 200000,
        capabilities: { streaming: true, tool_calling: true, vision: true, reasoning: true },
        description: 'Anthropic Claude 3.7 Sonnet with extended thinking mode for complex architecture and debugging',
      },
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'openrouter',
        context_length: 200000,
        capabilities: { streaming: true, tool_calling: true, vision: true, reasoning: true },
        description: 'Anthropic Claude 3.5 Sonnet — industry standard frontier agentic coding model',
      },
      {
        id: 'anthropic/claude-3.5-haiku',
        name: 'Claude 3.5 Haiku',
        provider: 'openrouter',
        context_length: 200000,
        capabilities: { streaming: true, tool_calling: true, vision: true },
        description: 'Anthropic Claude 3.5 Haiku — blazing-fast, cost-effective coding and triage',
      },
      {
        id: 'anthropic/claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'openrouter',
        context_length: 200000,
        capabilities: { streaming: true, tool_calling: true, vision: true, reasoning: true },
        description: 'Anthropic Claude 3 Opus — deep analytical comprehension and synthesis',
      },
      {
        id: 'anthropic/claude-sonnet-4-5',
        name: 'Claude Sonnet 4.5',
        provider: 'openrouter',
        context_length: 200000,
        capabilities: { streaming: true, tool_calling: true, vision: true, reasoning: true },
        description: 'Anthropic Claude Sonnet 4.5 — next-generation hybrid reasoning & coding',
      },
      {
        id: 'anthropic/claude-opus-4-5',
        name: 'Claude Opus 4.5',
        provider: 'openrouter',
        context_length: 200000,
        capabilities: { streaming: true, tool_calling: true, vision: true, reasoning: true },
        description: 'Anthropic Claude Opus 4.5 — pinnacle frontier intelligence for difficult engineering tasks',
      },

      // ── OpenAI ────────────────────────────────────────────────────
      {
        id: 'openai/gpt-4o',
        name: 'OpenAI GPT-4o',
        provider: 'openrouter',
        context_length: 128000,
        capabilities: { streaming: true, tool_calling: true, vision: true },
        description: 'OpenAI GPT-4o — multimodal flagship with high throughput and dependable tool execution',
      },
      {
        id: 'openai/gpt-4o-mini',
        name: 'OpenAI GPT-4o Mini',
        provider: 'openrouter',
        context_length: 128000,
        capabilities: { streaming: true, tool_calling: true, vision: true },
        description: 'OpenAI GPT-4o Mini — ultra-fast, affordable multimodal workhorse for continuous agent loops',
      },
      {
        id: 'openai/o3-mini',
        name: 'OpenAI o3-mini',
        provider: 'openrouter',
        context_length: 200000,
        capabilities: { streaming: true, tool_calling: true, reasoning: true },
        description: 'OpenAI o3-mini — high-speed frontier reasoning optimized for coding, mathematics, and STEM',
      },
      {
        id: 'openai/o3',
        name: 'OpenAI o3',
        provider: 'openrouter',
        context_length: 200000,
        capabilities: { streaming: true, tool_calling: true, reasoning: true },
        description: 'OpenAI o3 — frontier reasoning powerhouse for complex algorithmic tasks and architecture',
      },
      {
        id: 'openai/o1',
        name: 'OpenAI o1',
        provider: 'openrouter',
        context_length: 200000,
        capabilities: { streaming: true, tool_calling: true, reasoning: true },
        description: 'OpenAI o1 — deliberate reasoning model designed for hard engineering and scientific problems',
      },
      {
        id: 'openai/o1-mini',
        name: 'OpenAI o1-mini',
        provider: 'openrouter',
        context_length: 128000,
        capabilities: { streaming: true, tool_calling: true, reasoning: true },
        description: 'OpenAI o1-mini — fast reasoning model for STEM and mathematical deduction',
      },
      {
        id: 'openai/chatgpt-4o-latest',
        name: 'ChatGPT-4o Latest',
        provider: 'openrouter',
        context_length: 128000,
        capabilities: { streaming: true, tool_calling: true, vision: true },
        description: 'OpenAI ChatGPT-4o Latest — continuously updated dynamic research checkpoint',
      },

      // ── DeepSeek ──────────────────────────────────────────────────
      {
        id: 'deepseek/deepseek-r1',
        name: 'DeepSeek R1',
        provider: 'openrouter',
        context_length: 163840,
        capabilities: { streaming: true, tool_calling: true, reasoning: true },
        description: 'DeepSeek R1 — frontier open reasoning model with transparent chain-of-thought',
      },
      {
        id: 'deepseek/deepseek-chat',
        name: 'DeepSeek V3',
        provider: 'openrouter',
        context_length: 131072,
        capabilities: { streaming: true, tool_calling: true, vision: false },
        description: 'DeepSeek V3 (Chat) — 671B MoE frontier coding and general software engineering workhorse',
      },
      {
        id: 'deepseek/deepseek-r1-0528',
        name: 'DeepSeek R1 (0528)',
        provider: 'openrouter',
        context_length: 163840,
        capabilities: { streaming: true, tool_calling: true, reasoning: true },
        description: 'DeepSeek R1 0528 — updated reasoning checkpoint with enhanced verification',
      },

      // ── Google Gemini (via OpenRouter) ────────────────────────────
      {
        id: 'google/gemini-3.8-flash',
        name: 'Gemini 3.8 Flash',
        provider: 'openrouter',
        context_length: 1048576,
        capabilities: { streaming: true, tool_calling: true, vision: true, reasoning: true },
        description: 'Google Gemini 3.8 Flash — 1M context, high-throughput agentic engineering',
      },
      {
        id: 'google/gemini-3.7-flash',
        name: 'Gemini 3.7 Flash',
        provider: 'openrouter',
        context_length: 1048576,
        capabilities: { streaming: true, tool_calling: true, vision: true, reasoning: true },
        description: 'Google Gemini 3.7 Flash — complex coding and reliable agentic execution',
      },
      {
        id: 'google/gemini-3.1-pro-preview',
        name: 'Gemini 3.1 Pro (Preview)',
        provider: 'openrouter',
        context_length: 2097152,
        capabilities: { streaming: true, tool_calling: true, vision: true, reasoning: true },
        description: 'Google Gemini 3.1 Pro — advanced intelligence, 2M context, deep repository comprehension',
      },

      // ── Open Weights & Coding Models ──────────────────────────────
      {
        id: 'meta-llama/llama-3.3-70b-instruct',
        name: 'Llama 3.3 70B Instruct',
        provider: 'openrouter',
        context_length: 131072,
        capabilities: { streaming: true, tool_calling: true },
        description: 'Meta Llama 3.3 70B — robust open weights instruction model',
      },
      {
        id: 'qwen/qwen-2.5-coder-32b-instruct',
        name: 'Qwen 2.5 Coder 32B Instruct',
        provider: 'openrouter',
        context_length: 131072,
        capabilities: { streaming: true, tool_calling: true },
        description: 'Qwen 2.5 Coder 32B — dedicated code generation, debugging, and terminal tool execution',
      },
    ];
  }


  public async *stream(
    messages: Message[],
    options: ProviderRequestOptions
  ): AsyncIterable<NormalizedChunk> {
    const apiKey = await this.authStore.getApiKey('openrouter');
    if (!apiKey) {
      throw new Error(
        'OpenRouter API key not found. Run `berkelium auth login openrouter` or set OPENROUTER_API_KEY.'
      );
    }

    const payload: Record<string, unknown> = {
      model: options.model.replace(/^openrouter\//, ''),
      messages: this.formatMessages(messages, options.systemPrompt),
      stream: true,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 2048,
    };

    if (options.tools && options.tools.length > 0) {
      payload.tools = options.tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
      payload.tool_choice = options.toolChoice || 'auto';
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://berkelium.dev',
        'X-Title': 'Berkelium CLI',
      },
      body: JSON.stringify(payload),
      signal: options.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter API error (${res.status}): ${errText}`);
    }

    if (!res.body) throw new Error('No response body received from OpenRouter');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed === 'data: [DONE]') {
            yield { type: 'finish', finishReason: 'stop' };
            return;
          }
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const chunks = ResponseNormalizer.normalizeOpenAIChunk(parsed);
              for (const chunk of chunks) {
                yield chunk;
              }
            } catch {}
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  public async generate(
    messages: Message[],
    options: ProviderRequestOptions
  ): Promise<NormalizedResponse> {
    const acc = ResponseNormalizer.createAccumulator(options.model, 'openrouter');
    for await (const chunk of this.stream(messages, options)) {
      acc.processChunk(chunk);
    }
    return acc.toNormalizedResponse();
  }

  private formatMessages(messages: Message[], systemPrompt?: string): any[] {
    const formatted: any[] = [];
    if (systemPrompt) {
      formatted.push({ role: 'system', content: systemPrompt });
    }
    for (const m of messages) {
      if (m.role === 'tool') {
        formatted.push({
          role: 'tool',
          content: m.content || '',
          tool_call_id: m.tool_call_id,
        });
      } else if (m.role === 'assistant' && m.tool_calls && m.tool_calls.length > 0) {
        formatted.push({
          role: 'assistant',
          content: m.content || null,
          tool_calls: m.tool_calls.map((tc) => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.name,
              arguments: typeof tc.arguments === 'string' ? tc.arguments : JSON.stringify(tc.arguments),
            },
          })),
        });
      } else {
        formatted.push({
          role: m.role,
          content: m.content || '',
        });
      }
    }
    return formatted;
  }
}
