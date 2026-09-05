import { describe, it, expect } from 'vitest';
import { ResponseNormalizer } from '@berkelium/providers';

describe('ResponseNormalizer', () => {
  it('should normalize standard OpenAI/NVIDIA stream chunks', () => {
    const rawChunk = {
      choices: [
        {
          delta: {
            content: 'Hello, Berkelium!',
            reasoning_content: 'Let me think about this.',
          },
        },
      ],
    };

    const chunks = ResponseNormalizer.normalizeOpenAIChunk(rawChunk);
    expect(chunks.length).toBe(2);
    expect(chunks[0]).toEqual({ type: 'token', text: 'Hello, Berkelium!' });
    expect(chunks[1]).toEqual({ type: 'reasoning', reasoning: 'Let me think about this.' });
  });

  it('should accumulate chunks into NormalizedResponse', () => {
    const acc = ResponseNormalizer.createAccumulator('test-model', 'test-provider');

    acc.processChunk({ type: 'token', text: 'Step 1' });
    acc.processChunk({ type: 'token', text: ' is ready.' });
    acc.processChunk({
      type: 'tool_call_delta',
      toolCall: {
        index: 0,
        id: 'call_123',
        name: 'read_file',
        argumentsDelta: '{"path": "package.json"}',
      },
    });
    acc.processChunk({
      type: 'usage',
      usage: { promptTokens: 100, completionTokens: 25, totalTokens: 125 },
    });
    acc.processChunk({ type: 'finish', finishReason: 'tool_calls' });

    const response = acc.toNormalizedResponse();

    expect(response.text).toBe('Step 1 is ready.');
    expect(response.toolCalls.length).toBe(1);
    expect(response.toolCalls[0].name).toBe('read_file');
    expect(response.toolCalls[0].arguments).toEqual({ path: 'package.json' });
    expect(response.usage.totalTokens).toBe(125);
    expect(response.finishReason).toBe('tool_calls');
  });
});
