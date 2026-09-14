export interface SanitizedAssistantResult {
  content: string;
  reasoning?: string;
  leakageDetected: boolean;
}

/**
 * Patterns that represent internal reasoning or instruction leakage that
 * must NEVER reach the user-facing chat display.
 */
const LEAKAGE_HEADER_PATTERNS = [
  /^System\s+Prompt\s*:\s*[\s\S]*?(?=\n\n|\n[A-Z][a-z]+:|$)/im,
  /^Developer\s+Message\s*:\s*[\s\S]*?(?=\n\n|\n[A-Z][a-z]+:|$)/im,
  /^Internal\s+Reasoning\s*:\s*[\s\S]*?(?=\n\n|\n[A-Z][a-z]+:|$)/im,
  /^Chain\s+of\s+Thought\s*:\s*[\s\S]*?(?=\n\n|\n[A-Z][a-z]+:|$)/im,
  /^Hidden\s+Instructions\s*:\s*[\s\S]*?(?=\n\n|\n[A-Z][a-z]+:|$)/im,
  /^Tool\s+Selection\s*:\s*[\s\S]*?(?=\n\n|\n[A-Z][a-z]+:|$)/im,
  /^Thought\s+Process\s*:\s*[\s\S]*?(?=\n\n|\n[A-Z][a-z]+:|$)/im,
  /^Role\s*:\s*Berkelium[\s\S]*?(?=\n\n|\n[A-Z][a-z]+:|$)/im,
  /^Traits\s*:\s*[\s\S]*?(?=\n\n|\n[A-Z][a-z]+:|$)/im,
  /^Constraints\s*:\s*[\s\S]*?(?=\n\n|\n[A-Z][a-z]+:|$)/im,
  /^Greeting\s*:\s*/im,
];

/**
 * Sanitizes assistant responses to ensure that internal reasoning, thoughts,
 * system prompt fragments, and developer instructions are never displayed to the user.
 */
export function sanitizeAssistantResponse(rawText: string): SanitizedAssistantResult {
  if (!rawText) {
    return { content: '', leakageDetected: false };
  }

  let text = rawText;
  let extractedReasoning = '';
  let leakageDetected = false;

  // 1. Extract and strip XML-style thought and reasoning tags
  const thoughtTagRegexes = [
    /<thought>([\s\S]*?)<\/thought>/gi,
    /<think>([\s\S]*?)<\/think>/gi,
    /<reasoning>([\s\S]*?)<\/reasoning>/gi,
    /<internal_reasoning>([\s\S]*?)<\/internal_reasoning>/gi,
    /<scratchpad>([\s\S]*?)<\/scratchpad>/gi,
    /<reflection>([\s\S]*?)<\/reflection>/gi,
  ];

  for (const regex of thoughtTagRegexes) {
    text = text.replace(regex, (_, reasoningContent) => {
      leakageDetected = true;
      if (reasoningContent && reasoningContent.trim()) {
        extractedReasoning += (extractedReasoning ? '\n' : '') + reasoningContent.trim();
      }
      return '';
    });
  }

  // 2. Handle unclosed thought or think tags (in case of stream cut-off)
  const unclosedRegexes = [
    /<thought>[\s\S]*$/gi,
    /<think>[\s\S]*$/gi,
    /<reasoning>[\s\S]*$/gi,
    /<scratchpad>[\s\S]*$/gi,
  ];
  for (const regex of unclosedRegexes) {
    if (regex.test(text)) {
      leakageDetected = true;
      text = text.replace(regex, '');
    }
  }

  // 3. Strip accidental leakage patterns line-by-line / block-by-block
  for (const pattern of LEAKAGE_HEADER_PATTERNS) {
    if (pattern.test(text)) {
      leakageDetected = true;
      text = text.replace(pattern, '');
    }
  }

  // 4. Strip role-reconstruction block patterns if present
  // e.g.:
  // Role: Berkelium Codex
  // Traits: ...
  // Constraint: ...
  // Greeting: Hello! ...
  const roleReconstructionPattern = /(?:Role:\s*Berkelium[^\n]*\n)?(?:Traits:[^\n]*\n)?(?:Constraints?:[^\n]*\n)?(?:Greeting:\s*)?/gi;
  if (roleReconstructionPattern.test(text)) {
    const cleaned = text.replace(roleReconstructionPattern, '');
    if (cleaned !== text) {
      leakageDetected = true;
      text = cleaned;
    }
  }

  // 5. Clean up leading/trailing whitespace
  const sanitizedContent = text.trim();

  return {
    content: sanitizedContent,
    reasoning: extractedReasoning || undefined,
    leakageDetected,
  };
}

/**
 * StreamSanitizer buffers potential tag starts and strips reasoning blocks on the fly
 * during live model streaming.
 */
export class StreamSanitizer {
  private buffer = '';
  private isInThought = false;
  private onToken: (token: string) => void;
  private onReasoningStart?: () => void;
  private onReasoningEnd?: () => void;

  constructor(callbacks: {
    onToken: (token: string) => void;
    onReasoningStart?: () => void;
    onReasoningEnd?: () => void;
  }) {
    this.onToken = callbacks.onToken;
    this.onReasoningStart = callbacks.onReasoningStart;
    this.onReasoningEnd = callbacks.onReasoningEnd;
  }

  public feed(chunk: string): void {
    this.buffer += chunk;
    this.processBuffer();
  }

  private processBuffer(): void {
    while (this.buffer.length > 0) {
      if (this.isInThought) {
        // Look for closing </thought> or </think>
        const closeMatch = this.buffer.match(/<\/(?:thought|think|reasoning|scratchpad)>/i);
        if (closeMatch && closeMatch.index !== undefined) {
          this.isInThought = false;
          this.buffer = this.buffer.slice(closeMatch.index + closeMatch[0].length);
          if (this.onReasoningEnd) {
            this.onReasoningEnd();
          }
        } else {
          // Keep discarding inside thought
          // Leave last 15 chars in case closing tag is partially received
          if (this.buffer.length > 20) {
            this.buffer = this.buffer.slice(-20);
          }
          break;
        }
      } else {
        // Check for opening <thought> or <think>
        const openMatch = this.buffer.match(/<(?:thought|think|reasoning|scratchpad)>/i);
        if (openMatch && openMatch.index !== undefined) {
          // Emit text before thought tag
          if (openMatch.index > 0) {
            const before = this.buffer.slice(0, openMatch.index);
            this.emitClean(before);
          }
          this.isInThought = true;
          this.buffer = this.buffer.slice(openMatch.index + openMatch[0].length);
          if (this.onReasoningStart) {
            this.onReasoningStart();
          }
        } else {
          // Check if buffer ends with a potential opening tag prefix, e.g. "<th" or "<"
          const partialTag = this.buffer.match(/<[a-z]*$/i);
          if (partialTag && partialTag.index !== undefined) {
            const safeText = this.buffer.slice(0, partialTag.index);
            if (safeText) {
              this.emitClean(safeText);
              this.buffer = this.buffer.slice(partialTag.index);
            }
            break;
          } else {
            this.emitClean(this.buffer);
            this.buffer = '';
          }
        }
      }
    }
  }

  private emitClean(text: string): void {
    // Sanitize any immediate leakage headers
    let clean = text;
    for (const pattern of LEAKAGE_HEADER_PATTERNS) {
      clean = clean.replace(pattern, '');
    }
    if (clean) {
      this.onToken(clean);
    }
  }

  public flush(): void {
    if (this.buffer && !this.isInThought) {
      this.emitClean(this.buffer);
      this.buffer = '';
    } else if (this.isInThought) {
      this.isInThought = false;
      this.buffer = '';
      if (this.onReasoningEnd) {
        this.onReasoningEnd();
      }
    }
  }
}
