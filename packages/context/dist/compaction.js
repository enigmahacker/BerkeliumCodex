import { Tokenizer } from './tokenizer.js';
export class ContextCompactor {
    static compact(messages, maxBudgetTokens, thresholdRatio = 0.75) {
        const totalTokens = messages.reduce((sum, m) => sum + Tokenizer.countTokens(m.content || '') + 10, 0);
        if (totalTokens < maxBudgetTokens * thresholdRatio || messages.length <= 6) {
            return {
                compacted: false,
                messages,
                tokensBefore: totalTokens,
                tokensAfter: totalTokens,
            };
        }
        // Keep:
        // 1. Initial user request (index 0 or first non-system message)
        // 2. Last N turns (e.g. last 4 messages)
        // 3. Summarize middle conversation
        const systemMessages = messages.filter((m) => m.role === 'system');
        const nonSystem = messages.filter((m) => m.role !== 'system');
        if (nonSystem.length <= 4) {
            return {
                compacted: false,
                messages,
                tokensBefore: totalTokens,
                tokensAfter: totalTokens,
            };
        }
        const firstUserMsg = nonSystem[0];
        const recentMessages = nonSystem.slice(-4);
        const middleMessages = nonSystem.slice(1, -4);
        // Build condensed summary of middle actions and tool calls
        const summaryLines = ['[Compacted Conversation History Summary]'];
        const activeFilesModified = new Set();
        for (const msg of middleMessages) {
            if (msg.role === 'assistant' && msg.tool_calls) {
                for (const tc of msg.tool_calls) {
                    summaryLines.push(`- Executed tool \`${tc.name}\``);
                    if (typeof tc.arguments === 'object' && tc.arguments && tc.arguments.path) {
                        activeFilesModified.add(tc.arguments.path);
                    }
                }
            }
            else if (msg.role === 'user' && msg.content) {
                summaryLines.push(`- User note: ${msg.content.slice(0, 100)}`);
            }
        }
        if (activeFilesModified.size > 0) {
            summaryLines.push(`- Active files referenced: ${Array.from(activeFilesModified).join(', ')}`);
        }
        const summaryContent = summaryLines.join('\n');
        const summaryMessage = {
            role: 'assistant',
            content: summaryContent,
        };
        const compactedMessages = [
            ...systemMessages,
            firstUserMsg,
            summaryMessage,
            ...recentMessages,
        ];
        const tokensAfter = compactedMessages.reduce((sum, m) => sum + Tokenizer.countTokens(m.content || '') + 10, 0);
        return {
            compacted: true,
            messages: compactedMessages,
            tokensBefore: totalTokens,
            tokensAfter,
            summary: summaryContent,
        };
    }
}
//# sourceMappingURL=compaction.js.map