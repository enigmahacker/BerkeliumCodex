import { ResponseNormalizer } from '../normalizer.js';
export class GeminiProvider {
    id = 'gemini';
    name = 'Google Gemini';
    baseUrl;
    authStore;
    constructor(authStore, baseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai') {
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
        const key = await this.getApiKey();
        return Boolean(key);
    }
    async listModels() {
        try {
            const apiKey = await this.getApiKey();
            const headers = {};
            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
                headers['x-goog-api-key'] = apiKey;
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
                provider: 'gemini',
                context_length: m.context_window || 1048576,
                description: `Google Gemini official API: ${m.id}`,
                capabilities: {
                    streaming: true,
                    tool_calling: true,
                    reasoning: m.id.toLowerCase().includes('thinking') || m.id.toLowerCase().includes('reasoning'),
                    vision: true,
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
                id: 'gemini-2.0-flash',
                name: 'Gemini 2.0 Flash',
                provider: 'gemini',
                context_length: 1048576,
                capabilities: { streaming: true, tool_calling: true, vision: true },
                description: 'Next-generation multimodal workhorse model with high speed and tool support',
            },
            {
                id: 'gemini-2.5-pro',
                name: 'Gemini 2.5 Pro',
                provider: 'gemini',
                context_length: 2097152,
                capabilities: { streaming: true, tool_calling: true, vision: true, reasoning: true },
                description: 'Google frontier model for complex coding, reasoning, and long-context architecture',
            },
            {
                id: 'gemini-2.5-flash',
                name: 'Gemini 2.5 Flash',
                provider: 'gemini',
                context_length: 1048576,
                capabilities: { streaming: true, tool_calling: true, vision: true },
                description: 'Ultra-fast next-gen high-efficiency coding model',
            },
            {
                id: 'gemini-2.0-flash-thinking-exp-01-21',
                name: 'Gemini 2.0 Flash Thinking (Experimental)',
                provider: 'gemini',
                context_length: 1048576,
                capabilities: { streaming: true, tool_calling: true, vision: true, reasoning: true },
                description: 'Frontier reasoning model with native step-by-step thinking process',
            },
            {
                id: 'gemini-1.5-pro',
                name: 'Gemini 1.5 Pro',
                provider: 'gemini',
                context_length: 2097152,
                capabilities: { streaming: true, tool_calling: true, vision: true },
                description: 'Massive 2M token context window model for large codebase exploration',
            },
            {
                id: 'gemini-1.5-flash',
                name: 'Gemini 1.5 Flash',
                provider: 'gemini',
                context_length: 1048576,
                capabilities: { streaming: true, tool_calling: true, vision: true },
                description: 'High-throughput lightweight model for rapid edits',
            },
        ];
    }
    async *stream(messages, options) {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
            throw new Error('Google Gemini API key not found. Run `berkelium auth login gemini` or set GEMINI_API_KEY / GOOGLE_API_KEY.');
        }
        const modelId = options.model
            .replace(/^gemini\//i, '')
            .replace(/^google\//i, '')
            .replace(/^googleapi\//i, '');
        const payload = {
            model: modelId,
            messages: this.formatMessages(messages, options.systemPrompt),
            stream: true,
            temperature: options.temperature ?? 0.2,
            max_tokens: options.maxTokens ?? 8192,
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
                'x-goog-api-key': apiKey,
                'User-Agent': 'Berkelium-CLI/1.0.0',
            },
            body: JSON.stringify(payload),
            signal: options.signal,
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Google Gemini API error (${res.status}): ${errText}`);
        }
        if (!res.body)
            throw new Error('No response body received from Google Gemini API');
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
        const acc = ResponseNormalizer.createAccumulator(options.model, 'gemini');
        for await (const chunk of this.stream(messages, options)) {
            acc.processChunk(chunk);
        }
        return acc.toNormalizedResponse();
    }
    async getApiKey() {
        const geminiKey = await this.authStore.getApiKey('gemini');
        if (geminiKey)
            return geminiKey;
        return this.authStore.getApiKey('google');
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
//# sourceMappingURL=gemini.js.map