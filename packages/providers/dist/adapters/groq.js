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
                id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
                name: 'Llama 4 Maverick 17B (128E)',
                provider: 'groq',
                context_length: 1048576,
                capabilities: { streaming: true, tool_calling: true, vision: true },
                description: 'Meta Llama 4 MoE flagship — 1M context, vision, ultra-fast on Groq LPU',
            },
            {
                id: 'meta-llama/llama-4-scout-17b-16e-instruct',
                name: 'Llama 4 Scout 17B (16E)',
                provider: 'groq',
                context_length: 131072,
                capabilities: { streaming: true, tool_calling: true, vision: true },
                description: 'Meta Llama 4 efficient MoE — multimodal, fast, great for agentic loops',
            },
            {
                id: 'compound-beta',
                name: 'Compound Beta',
                provider: 'groq',
                context_length: 131072,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Groq compound system — internal routing for best speed/quality tradeoff',
            },
            {
                id: 'moonshotai/kimi-k2-instruct',
                name: 'Kimi K2 Instruct',
                provider: 'groq',
                context_length: 131072,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Moonshot AI Kimi K2 — 1T MoE frontier model optimized for agentic & coding tasks',
            },
            {
                id: 'qwen-qwq-32b',
                name: 'Qwen QwQ 32B',
                provider: 'groq',
                context_length: 131072,
                capabilities: { streaming: true, tool_calling: true, reasoning: true },
                description: 'Alibaba QwQ 32B — frontier reasoning model rivaling o1 class on Groq LPU',
            },
            {
                id: 'llama-3.3-70b-versatile',
                name: 'Llama 3.3 70B Versatile',
                provider: 'groq',
                context_length: 128000,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Meta Llama 3.3 70B — reliable high-capability workhorse on Groq LPU',
            },
            {
                id: 'deepseek-r1-distill-llama-70b',
                name: 'DeepSeek R1 Distill Llama 70B',
                provider: 'groq',
                context_length: 128000,
                capabilities: { streaming: true, tool_calling: false, reasoning: true },
                description: 'DeepSeek R1 reasoning distilled into Llama 70B, Groq LPU accelerated',
            },
            {
                id: 'llama-3.1-8b-instant',
                name: 'Llama 3.1 8B Instant',
                provider: 'groq',
                context_length: 128000,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Sub-100ms latency model for rapid iteration and low-cost tasks',
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