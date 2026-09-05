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

      return data.data.map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        provider: 'openrouter',
        context_length: m.context_length || 128000,
        description: m.description,
        capabilities: {
          streaming: true,
          tool_calling: m.description?.toLowerCase().includes('tools') || true,
          vision: m.architecture?.modality?.includes('image') || false,
          reasoning: m.id.includes('r1') || m.id.includes('reasoning'),
        },
      }));
    } catch {
      return this.getDefaultModels();
    }
  }

  private getDefaultModels(): ModelInfo[] {
    return [
      {
        id: 'anthropic/claude-3.7-sonnet',
        name: 'Claude 3.7 Sonnet',
        provider: 'openrouter',
        context_length: 200000,
        capabilities: { streaming: true, tool_calling: true, vision: true, reasoning: true },
      },
      {
        id: 'google/gemini-2.0-flash-001',
        name: 'Gemini 2.0 Flash',
        provider: 'openrouter',
        context_length: 1048576,
        capabilities: { streaming: true, tool_calling: true, vision: true },
      },
      {
        id: 'deepseek/deepseek-r1',
        name: 'DeepSeek R1',
        provider: 'openrouter',
        context_length: 163840,
        capabilities: { streaming: true, tool_calling: false, reasoning: true },
      },
      {
        id: 'meta-llama/llama-3.3-70b-instruct',
        name: 'Llama 3.3 70B Instruct',
        provider: 'openrouter',
        context_length: 131072,
        capabilities: { streaming: true, tool_calling: true },
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
