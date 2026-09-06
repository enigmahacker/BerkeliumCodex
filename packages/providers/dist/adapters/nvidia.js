import { ResponseNormalizer } from '../normalizer.js';
export class NVIDIAProvider {
    id = 'nvidia';
    name = 'NVIDIA NIM';
    baseUrl;
    authStore;
    constructor(authStore, baseUrl = 'https://integrate.api.nvidia.com/v1') {
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
        const key = await this.authStore.getApiKey('nvidia');
        return Boolean(key);
    }
    async listModels() {
        try {
            const apiKey = await this.authStore.getApiKey('nvidia');
            if (!apiKey)
                return this.getDefaultModels();
            const res = await fetch(`${this.baseUrl}/models`, {
                headers: { Authorization: `Bearer ${apiKey}` },
            });
            if (!res.ok)
                return this.getDefaultModels();
            const data = (await res.json());
            if (!data.data || !Array.isArray(data.data))
                return this.getDefaultModels();
            return data.data.map((m) => {
                const idLower = (m.id || '').toLowerCase();
                const isReasoning = idLower.includes('r1') || idLower.includes('nemotron') || idLower.includes('reason');
                const isVision = idLower.includes('vision') || idLower.includes('vl');
                return {
                    id: m.id,
                    name: m.id.split('/').pop() || m.id,
                    provider: 'nvidia',
                    context_length: m.context_length || 131072,
                    capabilities: {
                        streaming: true,
                        tool_calling: true,
                        reasoning: isReasoning,
                        vision: isVision,
                    },
                };
            });
        }
        catch {
            return this.getDefaultModels();
        }
    }
    getDefaultModels() {
        return [
            // ── DeepSeek on NVIDIA NIM ────────────────────────────────────
            {
                id: 'deepseek-ai/deepseek-r1',
                name: 'DeepSeek R1',
                provider: 'nvidia',
                context_length: 131072,
                capabilities: { streaming: true, tool_calling: true, reasoning: true },
                description: 'DeepSeek R1 frontier reasoning model accelerated on NVIDIA NIM Hopper/Blackwell architecture',
            },
            {
                id: 'deepseek-ai/deepseek-v3',
                name: 'DeepSeek V3',
                provider: 'nvidia',
                context_length: 131072,
                capabilities: { streaming: true, tool_calling: true, vision: false },
                description: 'DeepSeek V3 671B MoE flagship coding and general reasoning model on NVIDIA NIM',
            },
            // ── Meta Llama on NVIDIA NIM ──────────────────────────────────
            {
                id: 'meta/llama-3.3-70b-instruct',
                name: 'Llama 3.3 70B Instruct',
                provider: 'nvidia',
                context_length: 131072,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Meta latest 70B instruction model running with TensorRT-LLM on NVIDIA NIM',
            },
            {
                id: 'meta/llama-3.1-405b-instruct',
                name: 'Llama 3.1 405B Instruct',
                provider: 'nvidia',
                context_length: 131072,
                capabilities: { streaming: true, tool_calling: true, reasoning: true },
                description: 'Meta 405B premier open frontier model — pinnacle open-weights capability on NVIDIA NIM',
            },
            {
                id: 'meta/llama-3.1-70b-instruct',
                name: 'Llama 3.1 70B Instruct',
                provider: 'nvidia',
                context_length: 131072,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Meta 70B instruction-tuned model on NVIDIA NIM',
            },
            {
                id: 'meta/llama-3.1-8b-instruct',
                name: 'Llama 3.1 8B Instruct',
                provider: 'nvidia',
                context_length: 131072,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Meta 8B ultra-fast model for rapid terminal edits, diffs, and classification',
            },
            // ── NVIDIA Aligned & Custom Models ───────────────────────────
            {
                id: 'nvidia/llama-3.1-nemotron-70b-instruct',
                name: 'Llama 3.1 Nemotron 70B',
                provider: 'nvidia',
                context_length: 131072,
                capabilities: { streaming: true, tool_calling: true, reasoning: true },
                description: 'NVIDIA custom aligned high-accuracy enterprise model for complex engineering and reasoning',
            },
            {
                id: 'nvidia/llama-3.1-nemotron-51b-instruct',
                name: 'Llama 3.1 Nemotron 51B',
                provider: 'nvidia',
                context_length: 131072,
                capabilities: { streaming: true, tool_calling: true },
                description: 'NVIDIA ultra-efficient 51B aligned enterprise model optimized for low-latency inference',
            },
            {
                id: 'nvidia/mistral-nemo-12b-instruct',
                name: 'Mistral NeMo 12B Instruct',
                provider: 'nvidia',
                context_length: 131072,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Joint NVIDIA and Mistral AI 12B model with 128K context window',
            },
            // ── Qwen & Coding on NVIDIA NIM ───────────────────────────────
            {
                id: 'qwen/qwen2.5-coder-32b-instruct',
                name: 'Qwen 2.5 Coder 32B',
                provider: 'nvidia',
                context_length: 131072,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Qwen 2.5 Coder 32B — premier code generation and terminal agent workhorse on NVIDIA NIM',
            },
            {
                id: 'qwen/qwen2.5-72b-instruct',
                name: 'Qwen 2.5 72B Instruct',
                provider: 'nvidia',
                context_length: 131072,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Qwen 2.5 72B multilingual coding and reasoning flagship on NVIDIA NIM',
            },
            // ── Mistral on NVIDIA NIM ─────────────────────────────────────
            {
                id: 'mistralai/mistral-large-2-instruct',
                name: 'Mistral Large 2',
                provider: 'nvidia',
                context_length: 128000,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Mistral flagship frontier model with 128K context and strong multilingual coding on NVIDIA NIM',
            },
            {
                id: 'mistralai/codestral-22b-instruct-v0.1',
                name: 'Codestral 22B',
                provider: 'nvidia',
                context_length: 32768,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Mistral dedicated software engineering, code generation, and test completion model',
            },
            // ── Google & Microsoft on NVIDIA NIM ──────────────────────────
            {
                id: 'google/gemma-2-27b-it',
                name: 'Gemma 2 27B Instruct',
                provider: 'nvidia',
                context_length: 8192,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Google Gemma 2 27B high-efficiency open model running on NVIDIA NIM',
            },
            {
                id: 'microsoft/phi-3.5-moe-instruct',
                name: 'Phi 3.5 MoE Instruct',
                provider: 'nvidia',
                context_length: 131072,
                capabilities: { streaming: true, tool_calling: true },
                description: 'Microsoft mixture-of-experts 128K context model on NVIDIA NIM',
            },
        ];
    }
    async *stream(messages, options) {
        const apiKey = await this.authStore.getApiKey('nvidia');
        if (!apiKey) {
            throw new Error('NVIDIA API key not found. Run `berkelium auth login nvidia` or set NVIDIA_API_KEY.');
        }
        const payload = {
            model: options.model.replace(/^nvidia\//, ''),
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
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload),
            signal: options.signal,
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`NVIDIA API error (${res.status}): ${errText}`);
        }
        if (!res.body)
            throw new Error('No response body received from NVIDIA');
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
        const acc = ResponseNormalizer.createAccumulator(options.model, 'nvidia');
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
//# sourceMappingURL=nvidia.js.map