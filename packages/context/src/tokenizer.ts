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
}
