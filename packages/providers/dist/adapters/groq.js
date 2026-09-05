import { ResponseNormalizer } from '../normalizer.js';
export class GroqProvider {
    id = 'groq';
    name = 'Groq';
    baseUrl;
    authStore;
    constructor(authStore, baseUrl = 'https://api.groq.com/openai/v1') {
        this.authStore = authStore;
        this.baseUrl = baseUrl.replace(/\/$/, '');
    }
    capabilities() {
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
    async isAvailable() {
        const key = await this.authStore.getApiKey('groq');
        return Boolean(key);
    }
    async listModels() {
        try {
            const apiKey = await this.authStore.getApiKey('groq');
            const headers = {};
            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }
            const res = await fetch(`${this.baseUrl}/models`, { headers });
            if (!res.ok)
                return this.getDefaultModels();
            const data = (await res.json());
            if (!data.data || !Array.isArray(data.data))
                return this.getDefaultModels();
            return data.data.map((m) => ({
                id: m.id,
                name: m.id,
                provider: 'groq',
                context_length: m.context_window || 128000,
                description: `Groq LPU ultra-fast inference: ${m.id}`,
                capabilities: {
                    streaming: true,
                    tool_calling: true,
                    reasoning: m.id.toLowerCase().includes('r1') || m.id.toLowerCase().includes('reasoning'),
                    vision: m.id.toLowerCase().includes('vision') || m.id.toLowerCase().includes('vl'),
                },
            }));
        }
        catch {
            return this.getDefaultModels();
        }
    }
    getDefaultModels() {
        return [
            {
                id: 'llama-3.3-70b-versatile',
                name: 'Llama 3.3 70B Versatile',
                provider: 'groq',
                context_length: 128000,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Meta latest high-capability model with ultra-fast Groq LPU acceleration',
            },
            {
                id: 'llama-3.1-8b-instant',
                name: 'Llama 3.1 8B Instant',
                provider: 'groq',
                context_length: 128000,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Instant sub-second latency model for rapid iterations',
            },
            {
                id: 'deepseek-r1-distill-llama-70b',
                name: 'DeepSeek R1 Distill Llama 70B',
                provider: 'groq',
                context_length: 128000,
                capabilities: { streaming: true, tool_calling: false, reasoning: true },
                description: 'DeepSeek distilled frontier reasoning on Groq LPU hardware',
            },
            {
                id: 'mixtral-8x7b-32768',
                name: 'Mixtral 8x7B (32k)',
                provider: 'groq',
                context_length: 32768,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Mistral high-throughput mixture-of-experts model',
            },
            {
                id: 'gemma2-9b-it',
                name: 'Gemma 2 9B IT',
                provider: 'groq',
                context_length: 8192,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Google open weights lightweight model on Groq',
            },
            {
                id: 'qwen-2.5-32b',
                name: 'Qwen 2.5 32B',
                provider: 'groq',
                context_length: 128000,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Alibaba code & reasoning powerhouse on Groq',
            },
        ];
    }
    async *stream(messages, options) {
        const apiKey = await this.authStore.getApiKey('groq');
        if (!apiKey) {
            throw new Error('Groq API key not found. Run `berkelium auth login groq` or set GROQ_API_KEY.');
        }
        const modelId = options.model.replace(/^groq\//i, '');
        const payload = {
            model: modelId,
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
                'User-Agent': 'Berkelium-CLI/1.0.0',
            },
            body: JSON.stringify(payload),
            signal: options.signal,
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Groq API error (${res.status}): ${errText}`);
        }
        if (!res.body)
            throw new Error('No response body received from Groq');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith(':'))
                        continue;
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
                        }
                        catch { }
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    async generate(messages, options) {
        const acc = ResponseNormalizer.createAccumulator(options.model, 'groq');
        for await (const chunk of this.stream(messages, options)) {
            acc.processChunk(chunk);
        }
        return acc.toNormalizedResponse();
    }
    formatMessages(messages, systemPrompt) {
        const formatted = [];
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
            }
            else if (m.role === 'assistant' && m.tool_calls && m.tool_calls.length > 0) {
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
            }
            else {
                formatted.push({
                    role: m.role,
                    content: m.content || '',
                });
            }
        }
        return formatted;
    }
}
//# sourceMappingURL=groq.js.map