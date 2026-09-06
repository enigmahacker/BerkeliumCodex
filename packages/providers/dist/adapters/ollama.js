import { ResponseNormalizer } from '../normalizer.js';
export class OllamaProvider {
    id = 'ollama';
    name = 'Ollama';
    baseUrl;
    constructor(baseUrl = 'http://127.0.0.1:11434') {
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
            const res = await fetch(`${this.baseUrl}/api/version`, { signal: controller.signal });
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
            const res = await fetch(`${this.baseUrl}/api/tags`, { signal: controller.signal });
            clearTimeout(timeout);
            if (!res.ok)
                return this.getDefaultModels();
            const data = (await res.json());
            if (!data.models || !Array.isArray(data.models) || data.models.length === 0)
                return this.getDefaultModels();
            return data.models.map((m) => ({
                id: m.name,
                name: m.name,
                provider: 'ollama',
                context_length: m.details?.context_length || 32768,
                capabilities: {
                    streaming: true,
                    tool_calling: true,
                    vision: m.details?.families?.includes('clip') || false,
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
                id: 'qwen2.5-coder:14b',
                name: 'Qwen 2.5 Coder 14B (Ollama)',
                provider: 'ollama',
                context_length: 65536,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Qwen 2.5 Coder 14B instruction tuned model running locally on Ollama',
            },
            {
                id: 'qwen2.5-coder:32b',
                name: 'Qwen 2.5 Coder 32B (Ollama)',
                provider: 'ollama',
                context_length: 65536,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Qwen 2.5 Coder 32B powerhouse local coding model',
            },
            {
                id: 'deepseek-r1:14b',
                name: 'DeepSeek R1 14B (Ollama)',
                provider: 'ollama',
                context_length: 65536,
                capabilities: { streaming: true, tool_calling: true, reasoning: true },
                description: 'DeepSeek R1 reasoning model running locally on Ollama',
            },
            {
                id: 'llama3.3:70b',
                name: 'Llama 3.3 70B (Ollama)',
                provider: 'ollama',
                context_length: 128000,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Meta Llama 3.3 70B running locally on Ollama',
            },
        ];
    }
    async *stream(messages, options) {
        const isUp = await this.isAvailable();
        if (!isUp) {
            throw new Error('Ollama local service is not running at ' +
                this.baseUrl +
                '. Make sure `ollama serve` is running.');
        }
        const resolvedModel = await this.resolveModelName(options.model);
        const payload = {
            model: resolvedModel,
            messages: this.formatMessages(messages, options.systemPrompt),
            stream: true,
            options: {
                temperature: options.temperature ?? 0.2,
                num_predict: options.maxTokens,
            },
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
        }
        const res = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: options.signal,
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Ollama API error (${res.status}): ${errText}`);
        }
        if (!res.body)
            throw new Error('No response body from Ollama');
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
                    if (!trimmed)
                        continue;
                    try {
                        const parsed = JSON.parse(trimmed);
                        if (parsed.message?.content) {
                            yield {
                                type: 'token',
                                text: parsed.message.content,
                            };
                        }
                        if (parsed.message?.tool_calls && Array.isArray(parsed.message.tool_calls)) {
                            for (let i = 0; i < parsed.message.tool_calls.length; i++) {
                                const tc = parsed.message.tool_calls[i];
                                yield {
                                    type: 'tool_call_delta',
                                    toolCall: {
                                        index: i,
                                        name: tc.function?.name,
                                        argumentsDelta: JSON.stringify(tc.function?.arguments || {}),
                                    },
                                };
                            }
                        }
                        if (parsed.done) {
                            if (parsed.prompt_eval_count || parsed.eval_count) {
                                yield {
                                    type: 'usage',
                                    usage: {
                                        promptTokens: parsed.prompt_eval_count || 0,
                                        completionTokens: parsed.eval_count || 0,
                                        totalTokens: (parsed.prompt_eval_count || 0) + (parsed.eval_count || 0),
                                    },
                                };
                            }
                            yield { type: 'finish', finishReason: parsed.done_reason || 'stop' };
                            return;
                        }
                    }
                    catch { }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    async generate(messages, options) {
        const acc = ResponseNormalizer.createAccumulator(options.model, 'ollama');
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
                });
            }
            else if (m.role === 'assistant' && m.tool_calls && m.tool_calls.length > 0) {
                formatted.push({
                    role: 'assistant',
                    content: m.content || '',
                    tool_calls: m.tool_calls.map((tc) => ({
                        function: {
                            name: tc.name,
                            arguments: typeof tc.arguments === 'string' ? JSON.parse(tc.arguments) : tc.arguments,
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
    async resolveModelName(requested) {
        const raw = requested.replace(/^ollama\//, '');
        const installed = await this.listModels();
        if (installed.length === 0)
            return raw;
        // 1. Exact match
        const exact = installed.find((m) => m.id === raw);
        if (exact)
            return exact.id;
        // 2. Starts with / includes match
        const match = installed.find((m) => m.id.toLowerCase().startsWith(raw.toLowerCase()) || m.id.toLowerCase().includes(raw.toLowerCase()));
        if (match)
            return match.id;
        return raw;
    }
}
//# sourceMappingURL=ollama.js.map