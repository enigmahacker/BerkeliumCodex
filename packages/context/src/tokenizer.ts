import { Message } from '@berkelium/providers';

export class Tokenizer {
  /**
   * Fast, reliable token estimator.
   * On code and markdown, average English/code characters per token is ~3.5 to 3.8.
   */
  public static countTokens(text: string): number {
    if (!text || typeof text !== 'string') return 0;

    // Fast approximation based on word boundaries, symbols, and character length
    const wordsAndTokens = text.trim().split(/\s+|[^\w\s]/).filter(Boolean);
    const charCount = text.length;

    // Weighted combination of word/symbol splits and character length
    const tokenEstimate = Math.ceil(Math.max(wordsAndTokens.length * 1.1, charCount / 3.6));
    return tokenEstimate;
  }

  /**
   * Counts the full serialized cost of a message, including tool-call arguments.
   * Assistant messages that request tools often carry empty content and large
   * arguments (file contents, patches); budgeting only `content` undercounts them.
   */
  public static countMessageTokens(message: Message): number {
    let tokens = 10 + this.countTokens(message.content || '');

    if (message.name) tokens += this.countTokens(message.name);
    if (message.tool_call_id) tokens += this.countTokens(message.tool_call_id);
    if (message.reasoning) tokens += this.countTokens(message.reasoning);

    if (message.tool_calls?.length) {
      for (const call of message.tool_calls) {
        tokens += this.countTokens(call.name) + this.countTokens(call.id);
        tokens += this.countTokens(this.serializeArguments(call.arguments));
      }
    }

    return tokens;
  }

  private static serializeArguments(args: unknown): string {
    if (args === null || args === undefined) return '';
    if (typeof args === 'string') return args;
    try {
      return JSON.stringify(args);
    } catch {
      return String(args);
    }
  }
}
