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
            // ── Gemini 3 series ─────────────────────────────────────────────
            {
                id: 'gemini-3.8-flash',
                name: 'Gemini 3.8 Flash',
                provider: 'gemini',
                context_length: 1048576,
                capabilities: { streaming: true, tool_calling: true, vision: true, reasoning: true },
                description: '🆕 Newest stable Flash — engineered for long-horizon software engineering, autonomous agents, and complex enterprise workflows',
            },
            {
                id: 'gemini-3.7-flash',
                name: 'Gemini 3.7 Flash',
                provider: 'gemini',
                context_length: 1048576,
                capabilities: { streaming: true, tool_calling: true, vision: true, reasoning: true },
                description: 'Complex coding, agentic workflows, and reliable multi-step execution',
            },
            {
                id: 'gemini-3.6-flash',
                name: 'Gemini 3.6 Flash',
                provider: 'gemini',
                context_length: 1048576,
                capabilities: { streaming: true, tool_calling: true, vision: true },
                description: 'Balanced speed and multimodal capabilities across general agentic and everyday tasks',
            },
            {
                id: 'gemini-3.5-flash',
                name: 'Gemini 3.5 Flash',
                provider: 'gemini',
                context_length: 1048576,
                capabilities: { streaming: true, tool_calling: true, vision: true },
                description: 'Baseline speed and foundational performance for routine, high-throughput workloads',
            },
            {
                id: 'gemini-3.5-flash-lite',
                name: 'Gemini 3.5 Flash-Lite',
                provider: 'gemini',
                context_length: 1048576,
                capabilities: { streaming: true, tool_calling: true, vision: true },
                description: 'Fastest, most cost-effective 3.5 model for high-throughput execution',
            },
            {
                id: 'gemini-3.1-flash-lite',
                name: 'Gemini 3.1 Flash-Lite',
                provider: 'gemini',
                context_length: 1048576,
                capabilities: { streaming: true, tool_calling: true, vision: true },
                description: 'Frontier-class performance rivaling larger models at a fraction of the cost',
            },
            // ── Gemini 3 preview ────────────────────────────────────────────
            {
                id: 'gemini-3.1-pro-preview',
                name: 'Gemini 3.1 Pro (Preview)',
                provider: 'gemini',
                context_length: 2097152,
                capabilities: { streaming: true, tool_calling: true, vision: true, reasoning: true },
                description: 'Advanced intelligence with complex problem-solving and powerful agentic coding capabilities',
            },
            {
                id: 'gemini-3-flash-preview',
                name: 'Gemini 3 Flash (Preview)',
                provider: 'gemini',
                context_length: 1048576,
                capabilities: { streaming: true, tool_calling: true, vision: true },
                description: 'Frontier-class performance rivaling larger models at a fraction of the cost',
            },
            // ── Legacy (Gemini 2.5) ──────────────────────────────────────────
            {
                id: 'gemini-2.5-pro',
                name: 'Gemini 2.5 Pro',
                provider: 'gemini',
                context_length: 2097152,
                capabilities: { streaming: true, tool_calling: true, vision: true, reasoning: true },
                description: 'Legacy: Google 2.5 Pro — 2M context, strong reasoning (superseded by Gemini 3 series)',
            },
            {
                id: 'gemini-2.5-flash',
                name: 'Gemini 2.5 Flash',
                provider: 'gemini',
                context_length: 1048576,
                capabilities: { streaming: true, tool_calling: true, vision: true, reasoning: true },
                description: 'Legacy: Gemini 2.5 Flash with thinking mode',
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