import { describe, it, expect } from 'vitest';
import { ContextCompactor } from '@berkelium/context';
import { Message } from '@berkelium/providers';

describe('ContextCompactor', () => {
  it('should not compact if tokens are well within budget', () => {
    const messages: Message[] = [
      { role: 'user', content: 'Short question' },
      { role: 'assistant', content: 'Short answer' },
    ];

    const res = ContextCompactor.compact(messages, 10000);
    expect(res.compacted).toBe(false);
    expect(res.messages.length).toBe(2);
  });

  it('should compact long conversation preserving head and tail', () => {
    const messages: Message[] = [
      { role: 'system', content: 'System instruction' },
      { role: 'user', content: 'Initial user prompt' },
    ];

    for (let i = 0; i < 20; i++) {
      messages.push({
        role: 'assistant',
        content: `Iteration response ${i} with detailed information and logs.`,
        tool_calls: [{ id: `call_${i}`, name: 'read_file', arguments: { path: `src/mod_${i}.ts` } }],
      });
      messages.push({
        role: 'tool',
        content: `Output results chunk ${i} with long data.`,
        tool_call_id: `call_${i}`,
      });
    }

    // Force compaction with low budget
    const res = ContextCompactor.compact(messages, 200, 0.1);

    expect(res.compacted).toBe(true);
    expect(res.tokensAfter).toBeLessThan(res.tokensBefore);
    expect(res.messages[0].role).toBe('system');
    expect(res.messages[1].content).toBe('Initial user prompt');
    expect(res.summary).toBeDefined();
  });
});
