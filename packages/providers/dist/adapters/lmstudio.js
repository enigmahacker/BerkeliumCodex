import { ResponseNormalizer } from '../normalizer.js';
export class LMStudioProvider {
    id = 'lmstudio';
    name = 'LM Studio';
    baseUrl;
    constructor(baseUrl = 'http://127.0.0.1:1234/v1') {
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
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 1000);
            const res = await fetch(`${this.baseUrl}/models`, { signal: controller.signal });
            clearTimeout(timeout);
            return res.ok;
        }
        catch {
            return false;
        }
    }
    async listModels() {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 1500);
            const res = await fetch(`${this.baseUrl}/models`, { signal: controller.signal });
            clearTimeout(timeout);
            if (!res.ok)
                return this.getDefaultModels();
            const data = (await res.json());
            if (!data.data || !Array.isArray(data.data) || data.data.length === 0)
                return this.getDefaultModels();
            return data.data.map((m) => ({
                id: m.id,
                name: m.id,
                provider: 'lmstudio',
                context_length: m.context_length || 65536,
                capabilities: {
                    streaming: true,
                    tool_calling: true,
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
                id: 'deepseek-coder-v2',
                name: 'DeepSeek Coder V2 (LM Studio)',
                provider: 'lmstudio',
                context_length: 65536,
                capabilities: { streaming: true, tool_calling: true },
                description: 'DeepSeek Coder V2 running on local LM Studio inference server',
            },
            {
                id: 'qwen2.5-coder-7b-instruct',
                name: 'Qwen 2.5 Coder 7B (LM Studio)',
                provider: 'lmstudio',
                context_length: 32768,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Qwen 2.5 Coder instruction model running on local LM Studio server',
            },
            {
                id: 'meta-llama-3.1-8b-instruct',
                name: 'Llama 3.1 8B (LM Studio)',
                provider: 'lmstudio',
                context_length: 128000,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Meta Llama 3.1 8B running on local LM Studio server',
            },
        ];
    }
    async *stream(messages, options) {
        const isUp = await this.isAvailable();
        if (!isUp) {
            throw new Error('LM Studio local server is not running at ' +
                this.baseUrl +
                '. Start the local inference server in LM Studio.');
        }
        const payload = {
            model: options.model.replace(/^lmstudio\//, ''),
            messages: this.formatMessages(messages, options.systemPrompt),
            stream: true,
            temperature: options.temperature ?? 0.2,
            max_tokens: options.maxTokens,
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: options.signal,
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`LM Studio API error (${res.status}): ${errText}`);
        }
        if (!res.body)
            throw new Error('No response body from LM Studio');
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
        const acc = ResponseNormalizer.createAccumulator(options.model, 'lmstudio');
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
//# sourceMappingURL=lmstudio.js.map