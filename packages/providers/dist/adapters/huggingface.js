import { ResponseNormalizer } from '../normalizer.js';
export class HuggingFaceProvider {
    id = 'huggingface';
    name = 'Hugging Face';
    baseUrl;
    authStore;
    constructor(authStore, baseUrl = 'https://router.huggingface.co/hf-inference/v1') {
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
            embeddings: true,
            model_discovery: true,
        };
    }
    async isAvailable() {
        const key = await this.authStore.getApiKey('huggingface');
        return Boolean(key);
    }
    async listModels() {
        try {
            const apiKey = await this.authStore.getApiKey('huggingface');
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
                name: m.name || m.id,
                provider: 'huggingface',
                context_length: m.context_length || 65536,
                description: m.description,
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
                id: 'meta-llama/Llama-3.3-70B-Instruct',
                name: 'Llama 3.3 70B Instruct',
                provider: 'huggingface',
                context_length: 131072,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Meta state-of-the-art open weights model on Hugging Face Serverless',
            },
            {
                id: 'deepseek-ai/DeepSeek-R1',
                name: 'DeepSeek R1',
                provider: 'huggingface',
                context_length: 163840,
                capabilities: { streaming: true, tool_calling: false, reasoning: true },
                description: 'DeepSeek frontier reasoning model',
            },
            {
                id: 'deepseek-ai/DeepSeek-V3',
                name: 'DeepSeek V3',
                provider: 'huggingface',
                context_length: 131072,
                capabilities: { streaming: true, tool_calling: true },
                description: 'DeepSeek mixture-of-experts general coding and chat model',
            },
            {
                id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
                name: 'Qwen 2.5 Coder 32B Instruct',
                provider: 'huggingface',
                context_length: 65536,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Alibaba leading code intelligence model',
            },
            {
                id: 'mistralai/Mistral-Small-24B-Instruct-2501',
                name: 'Mistral Small 24B Instruct',
                provider: 'huggingface',
                context_length: 32768,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Mistral high efficiency reasoning and coding model',
            },
            {
                id: 'microsoft/Phi-3.5-mini-instruct',
                name: 'Phi 3.5 Mini Instruct',
                provider: 'huggingface',
                context_length: 131072,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Microsoft lightweight high performance instruction model',
            },
        ];
    }
    async *stream(messages, options) {
        const apiKey = await this.authStore.getApiKey('huggingface');
        if (!apiKey) {
            throw new Error('Hugging Face API token not found. Run `berkelium auth login huggingface` or set HF_TOKEN / HUGGINGFACE_API_KEY.');
        }
        const modelId = options.model.replace(/^(?:huggingface|hf)\//i, '');
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
            throw new Error(`Hugging Face API error (${res.status}): ${errText}`);
        }
        if (!res.body)
            throw new Error('No response body received from Hugging Face');
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
        const acc = ResponseNormalizer.createAccumulator(options.model, 'huggingface');
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
//# sourceMappingURL=huggingface.js.map