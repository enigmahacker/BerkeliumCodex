import { Message } from '@berkelium/providers';
import { Tokenizer } from './tokenizer.js';

export interface CompactionResult {
  compacted: boolean;
  messages: Message[];
  tokensBefore: number;
  tokensAfter: number;
  tokensSaved: number;
  summary?: string;
  microCompactedCount?: number;
}


export interface MicroCompactionOptions {
  keepRecentTurns?: number;
  maxOutputChars?: number;
}

export class MicroOutputCompactor {
  private static ANSI_REGEX = /\u001b\[[0-9;]*[a-zA-Z]/g;
  private static PROGRESS_REGEX = /(?:\[[#=\-\s>]+\]\s*\d+%|\b\d+%\s*\[[#=\-\s>]+\]|\b(?:downloading|uploading|building|fetching)\s+\d+%\b)/gi;

  /**
   * Compacts large tool outputs from historical turns (> keepRecentTurns ago),
   * while keeping recent turns in 100% full fidelity.
   */
  public static compactToolOutputs(
    messages: Message[],
    options: MicroCompactionOptions = {}
  ): { messages: Message[]; tokensSaved: number; compactedCount: number } {
    const keepRecentTurns = options.keepRecentTurns ?? 2;
    const maxOutputChars = options.maxOutputChars ?? 280;

    if (messages.length <= keepRecentTurns * 2 + 1) {
      return { messages, tokensSaved: 0, compactedCount: 0 };
    }

    // Find cut-off index for recent turns
    // Each turn typically consists of an assistant message followed by tool responses
    let turnCount = 0;
    let recentCutoffIndex = messages.length;

    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user' || messages[i].role === 'assistant') {
        turnCount++;
        if (turnCount >= keepRecentTurns * 2) {
          recentCutoffIndex = i;
          break;
        }
      }
    }

    let tokensSaved = 0;
    let compactedCount = 0;

    const compactedMessages: Message[] = messages.map((msg, idx) => {
      // Only compact tool output messages from older turns
      if (msg.role !== 'tool' || idx >= recentCutoffIndex || !msg.content) {
        return msg;
      }

      const originalContent = msg.content;
      const originalTokens = Tokenizer.countTokens(originalContent);

      // If output is already short, keep as is
      if (originalContent.length <= maxOutputChars) {
        return msg;
      }

      const toolName = (msg.name || '').toLowerCase();
      let compactedContent: string;

      if (toolName.includes('search') || toolName.includes('grep') || toolName.includes('find')) {
        compactedContent = this.compactSearchOutput(originalContent);
      } else if (toolName.includes('read') || toolName.includes('view') || toolName === 'file' || toolName.startsWith('file_read') || toolName.endsWith('_read') || toolName === 'read_file') {
        compactedContent = this.compactFileRead(originalContent);
      } else if (toolName.includes('diff')) {
        compactedContent = this.compactDiffOutput(originalContent);
      } else if (toolName.includes('list') || toolName.includes('dir')) {
        compactedContent = this.compactListDirOutput(originalContent);
      } else if (toolName.includes('shell') || toolName.includes('exec') || toolName.includes('command') || toolName.includes('run') || toolName === 'test' || toolName === 'build') {
        compactedContent = this.compactCommandOutput(originalContent);
      } else {
        compactedContent = this.compactGenericOutput(originalContent, maxOutputChars);
      }


      const newTokens = Tokenizer.countTokens(compactedContent);
      if (newTokens < originalTokens) {
        tokensSaved += (originalTokens - newTokens);
        compactedCount++;
        return {
          ...msg,
          content: compactedContent,
        };
      }

      return msg;
    });

    return {
      messages: compactedMessages,
      tokensSaved,
      compactedCount,
    };
  }

  private static compactFileRead(content: string): string {
    const lines = content.split('\n');
    const lineCount = lines.length;
    const charCount = content.length;

    // Extract key symbol declarations (functions, classes, interfaces, types)
    const symbols: string[] = [];
    for (const line of lines) {
      const match = line.match(/(?:export\s+)?(?:async\s+)?(?:class|function|interface|type|const|enum)\s+([A-Za-z0-9_$]+)/);
      if (match && !symbols.includes(match[1]) && symbols.length < 10) {
        symbols.push(match[1]);
      }
    }

    const symbolStr = symbols.length > 0
      ? ` | Key symbols: ${symbols.join(', ')}`
      : '';

    return `[Read file (${lineCount} lines, ${charCount} chars)${symbolStr} — Full content elided from historical turn; re-read with read_file if needed]`;
  }

  private static compactSearchOutput(content: string): string {
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    const files = new Set<string>();

    for (const line of lines) {
      const fileMatch = line.match(/^(?:\{"File":\s*"([^"]+)"|([A-Za-z0-9_./\\-]+\.[A-Za-z0-9]+)[:\-0-9])/);
      if (fileMatch) {
        files.add(fileMatch[1] || fileMatch[2]);
      }
    }

    const fileList = Array.from(files).slice(0, 5).join(', ');
    const moreStr = files.size > 5 ? ` and ${files.size - 5} more` : '';

    return `[Search results: ${lines.length} matches found across ${files.size} file(s) (${fileList}${moreStr}) — Compacted historical search output]`;
  }

  private static compactCommandOutput(content: string): string {
    // Strip ANSI & progress noise
    let cleaned = content.replace(this.ANSI_REGEX, '').replace(this.PROGRESS_REGEX, '').trim();

    // Check if command contained failure/error
    const isError = /(?:error|failed|fatal|exception|command failed|exit code [1-9])/i.test(cleaned);

    const lines = cleaned.split('\n');
    if (lines.length <= 8) {
      return cleaned;
    }

    if (isError) {
      // For errors, keep head + full error lines + tail
      const errorLines = lines.filter((l) => /(?:error|fail|exception|at\s+|exit\s+code)/i.test(l)).slice(0, 6);
      return [
        lines.slice(0, 3).join('\n'),
        `[... ${lines.length - 6} non-error lines omitted for economy ...]`,
        ...errorLines,
        lines.slice(-3).join('\n'),
      ].join('\n');
    }

    // For successful commands, keep summary header and tail
    return [
      lines.slice(0, 2).join('\n'),
      `[... ${lines.length - 4} output lines omitted for economy ...]`,
      lines.slice(-2).join('\n'),
    ].join('\n');
  }

  private static compactDiffOutput(content: string): string {
    const lines = content.split('\n');
    const fileHeaders = lines.filter((l) => l.startsWith('diff --git') || l.startsWith('+++ b/'));
    const additions = lines.filter((l) => l.startsWith('+') && !l.startsWith('+++')).length;
    const deletions = lines.filter((l) => l.startsWith('-') && !l.startsWith('---')).length;

    return `[Git diff: ${Math.max(1, fileHeaders.length)} file(s) modified (+${additions} / -${deletions} lines) — Compacted historical diff]`;
  }

  private static compactListDirOutput(content: string): string {
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    const sample = lines.slice(0, 4).map((l) => l.trim()).join(', ');
    return `[Directory list: ${lines.length} entries (${sample}...) — Compacted historical listing]`;
  }

  private static compactGenericOutput(content: string, maxChars: number): string {
    const headLen = Math.floor(maxChars / 2);
    const tailLen = Math.floor(maxChars / 2);
    const omitted = content.length - (headLen + tailLen);
    return `${content.slice(0, headLen)}\n[... ${omitted} chars compacted for token economy ...]\n${content.slice(-tailLen)}`;
  }
}

export class ContextCompactor {
  public static compact(
    messages: Message[],
    maxBudgetTokens: number,
    thresholdRatio = 0.75
  ): CompactionResult {
    const totalTokens = messages.reduce(
      (sum, m) => sum + Tokenizer.countTokens(m.content || '') + 10,
      0
    );

    // Step 1: Always apply Micro-Output Compaction to historical tool results
    const micro = MicroOutputCompactor.compactToolOutputs(messages, { keepRecentTurns: 2 });
    let currentMessages = micro.messages;
    let tokensAfterMicro = currentMessages.reduce(
      (sum, m) => sum + Tokenizer.countTokens(m.content || '') + 10,
      0
    );

    // If micro-compaction brought us well below budget threshold, we are done!
    // No turns or conversational memory needed to be discarded.
    if (tokensAfterMicro < maxBudgetTokens * thresholdRatio || currentMessages.length <= 6) {
      return {
        compacted: micro.tokensSaved > 0,
        messages: currentMessages,
        tokensBefore: totalTokens,
        tokensAfter: tokensAfterMicro,
        tokensSaved: totalTokens - tokensAfterMicro,
        microCompactedCount: micro.compactedCount,
      };
    }

    // Step 2: Multi-tier Conversation Compaction if still above budget
    const systemMessages = currentMessages.filter((m) => m.role === 'system');
    const nonSystem = currentMessages.filter((m) => m.role !== 'system');

    if (nonSystem.length <= 4) {
      return {
        compacted: micro.tokensSaved > 0,
        messages: currentMessages,
        tokensBefore: totalTokens,
        tokensAfter: tokensAfterMicro,
        tokensSaved: totalTokens - tokensAfterMicro,
        microCompactedCount: micro.compactedCount,
      };
    }

    const firstUserMsg = nonSystem[0];
    const recentMessages = nonSystem.slice(-4);
    const middleMessages = nonSystem.slice(1, -4);

    // Build condensed summary of middle actions and tool calls
    const summaryLines: string[] = ['[Compacted Conversation History Summary]'];
    const activeFilesModified = new Set<string>();

    for (const msg of middleMessages) {
      if (msg.role === 'assistant' && msg.tool_calls) {
        for (const tc of msg.tool_calls) {
          summaryLines.push(`- Executed tool \`${tc.name}\``);
          if (typeof tc.arguments === 'object' && tc.arguments && (tc.arguments as any).path) {
            activeFilesModified.add((tc.arguments as any).path);
          }
        }
      } else if (msg.role === 'user' && msg.content) {
        summaryLines.push(`- User note: ${msg.content.slice(0, 100)}`);
      }
    }

    if (activeFilesModified.size > 0) {
      summaryLines.push(`- Active files referenced: ${Array.from(activeFilesModified).join(', ')}`);
    }

    const summaryContent = summaryLines.join('\n');
    const summaryMessage: Message = {
      role: 'assistant',
      content: summaryContent,
    };

    const compactedMessages: Message[] = [
      ...systemMessages,
      firstUserMsg,
      summaryMessage,
      ...recentMessages,
    ];

    const finalTokens = compactedMessages.reduce(
      (sum, m) => sum + Tokenizer.countTokens(m.content || '') + 10,
      0
    );

    return {
      compacted: true,
      messages: compactedMessages,
      tokensBefore: totalTokens,
      tokensAfter: finalTokens,
      tokensSaved: totalTokens - finalTokens,
      summary: summaryContent,
      microCompactedCount: micro.compactedCount,
    };
  }
}

