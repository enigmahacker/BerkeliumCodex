import { NormalizedChunk, NormalizedResponse, ToolCall, TokenUsageInfo } from './types.js';

export class ResponseNormalizer {
  public static createAccumulator(model: string, provider: string) {
    let fullText = '';
    let fullReasoning = '';
    const toolCallsMap: Map<number, { id: string; name: string; argsString: string }> = new Map();
    let usage: TokenUsageInfo = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
    let finishReason = 'stop';

    return {
      processChunk(chunk: NormalizedChunk) {
        if (chunk.type === 'token' && chunk.text) {
          fullText += chunk.text;
        } else if (chunk.type === 'reasoning' && chunk.reasoning) {
          fullReasoning += chunk.reasoning;
        } else if (chunk.type === 'tool_call_delta' && chunk.toolCall) {
          const idx = chunk.toolCall.index ?? 0;
          if (!toolCallsMap.has(idx)) {
            toolCallsMap.set(idx, {
              id: chunk.toolCall.id || `call_${idx}_${Date.now()}`,
              name: chunk.toolCall.name || '',
              argsString: '',
            });
          }
          const curr = toolCallsMap.get(idx)!;
          if (chunk.toolCall.id) curr.id = chunk.toolCall.id;
          if (chunk.toolCall.name) curr.name = chunk.toolCall.name;
          if (chunk.toolCall.argumentsDelta) curr.argsString += chunk.toolCall.argumentsDelta;
        } else if (chunk.type === 'usage' && chunk.usage) {
          usage = { ...usage, ...chunk.usage };
        } else if (chunk.type === 'finish' && chunk.finishReason) {
          finishReason = chunk.finishReason;
        }
      },

      toNormalizedResponse(): NormalizedResponse {
        const toolCalls: ToolCall[] = [];
        for (const [, item] of toolCallsMap.entries()) {
          let parsedArgs: Record<string, unknown> = {};
          try {
            parsedArgs = JSON.parse(item.argsString || '{}');
          } catch {
            parsedArgs = { raw: item.argsString };
          }
          toolCalls.push({
            id: item.id,
            name: item.name,
            arguments: parsedArgs,
          });
        }

        return {
          text: fullText,
          reasoning: fullReasoning || undefined,
          toolCalls,
          usage,
          finishReason,
          model,
          provider,
        };
      },
    };
  }

  public static normalizeOpenAIChunk(raw: any): NormalizedChunk[] {
    const chunks: NormalizedChunk[] = [];
    if (!raw || !raw.choices || raw.choices.length === 0) {
      if (raw && raw.usage) {
        chunks.push({
          type: 'usage',
          usage: {
            promptTokens: raw.usage.prompt_tokens || 0,
            completionTokens: raw.usage.completion_tokens || 0,
            totalTokens: raw.usage.total_tokens || 0,
            reasoningTokens: raw.usage.completion_tokens_details?.reasoning_tokens,
          },
        });
      }
      return chunks;
    }

    const choice = raw.choices[0];
    const delta = choice.delta || {};

    // 1. Text content
    const text = delta.content || delta.text || (typeof choice.text === 'string' ? choice.text : null);
    if (text) {
      chunks.push({
        type: 'token',
        text,
      });
    }

    // 2. Reasoning content (e.g. DeepSeek R1, OpenAI o-series)
    if (delta.reasoning_content || delta.reasoning) {
      chunks.push({
        type: 'reasoning',
        reasoning: delta.reasoning_content || delta.reasoning,
      });
    }

    // 3. Tool calls
    if (delta.tool_calls && Array.isArray(delta.tool_calls)) {
      for (const tc of delta.tool_calls) {
        chunks.push({
          type: 'tool_call_delta',
          toolCall: {
            index: tc.index ?? 0,
            id: tc.id,
            name: tc.function?.name,
            argumentsDelta: tc.function?.arguments,
          },
        });
      }
    }

    // 4. Finish reason
    if (choice.finish_reason) {
      chunks.push({
        type: 'finish',
        finishReason: choice.finish_reason,
      });
    }

    return chunks;
  }
}
