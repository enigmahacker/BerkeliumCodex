import { CommandDefinition, CommandMatchResult, ArgumentMatchResult } from './types.js';

export class CommandMatcher {
  /**
   * Match a query against a list of CommandDefinitions.
   * Ranking rules:
   * 1. Exact match (Score 1000)
   * 2. Prefix match (Score 800 - length delta)
   * 3. Word-prefix match (Score 600)
   * 4. Fuzzy subsequence match (Score 400 - distance penalty)
   */
  public static matchCommands(
    commands: CommandDefinition[],
    query: string
  ): CommandMatchResult[] {
    const cleanQuery = query.replace(/^\//, '').trim().toLowerCase();
    const results: CommandMatchResult[] = [];

    for (const cmd of commands) {
      const match = this.scoreMatch(cmd.name, cleanQuery);
      if (match) {
        results.push({
          command: cmd,
          score: match.score,
          matchedIndices: match.matchedIndices,
        });
        continue;
      }

      // Check aliases if primary name didn't match
      if (cmd.aliases && cmd.aliases.length > 0) {
        let bestAliasMatch: { score: number; matchedIndices: number[] } | null = null;
        for (const alias of cmd.aliases) {
          const aliasMatch = this.scoreMatch(alias, cleanQuery);
          if (aliasMatch && (!bestAliasMatch || aliasMatch.score > bestAliasMatch.score)) {
            bestAliasMatch = {
              score: aliasMatch.score - 50, // Slight penalty for alias
              matchedIndices: [],
            };
          }
        }
        if (bestAliasMatch) {
          results.push({
            command: cmd,
            score: bestAliasMatch.score,
            matchedIndices: bestAliasMatch.matchedIndices,
          });
        }
      }
    }

    // Sort descending by score, then alphabetically
    return results.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.command.name.localeCompare(b.command.name);
    });
  }

  /**
   * Match a query against dynamic argument options.
   */
  public static matchArguments(
    options: Array<{ value: string; description?: string }>,
    query: string
  ): ArgumentMatchResult[] {
    const cleanQuery = query.trim().toLowerCase();
    const results: ArgumentMatchResult[] = [];

    for (const opt of options) {
      if (!cleanQuery) {
        results.push({
          value: opt.value,
          description: opt.description,
          score: 100,
          matchedIndices: [],
        });
        continue;
      }

      const match = this.scoreMatch(opt.value, cleanQuery);
      if (match) {
        results.push({
          value: opt.value,
          description: opt.description,
          score: match.score,
          matchedIndices: match.matchedIndices,
        });
      }
    }

    return results.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.value.localeCompare(b.value);
    });
  }

  private static scoreMatch(
    target: string,
    query: string
  ): { score: number; matchedIndices: number[] } | null {
    const t = target.toLowerCase();
    const q = query.toLowerCase();

    if (!q) {
      return { score: 100, matchedIndices: [] };
    }

    // 1. Exact Match
    if (t === q) {
      const indices = Array.from({ length: t.length }, (_, i) => i);
      return { score: 1000, matchedIndices: indices };
    }

    // 2. Prefix Match
    if (t.startsWith(q)) {
      const indices = Array.from({ length: q.length }, (_, i) => i);
      return { score: 800 - (t.length - q.length), matchedIndices: indices };
    }

    // 3. Word-Boundary Match (e.g. "subagent" -> "sa", "read_file" -> "rf")
    const words = t.split(/[-_/\s]/);
    if (words.length > 1) {
      const initials = words.map((w) => w[0]).join('');
      if (initials.startsWith(q)) {
        return { score: 650, matchedIndices: [0] };
      }
    }

    // 4. Subsequence Fuzzy Match
    let qIdx = 0;
    let tIdx = 0;
    const matchedIndices: number[] = [];
    let distancePenalty = 0;
    let lastMatched = -1;

    while (qIdx < q.length && tIdx < t.length) {
      if (q[qIdx] === t[tIdx]) {
        if (lastMatched !== -1 && tIdx > lastMatched + 1) {
          distancePenalty += (tIdx - lastMatched - 1) * 2;
        }
        matchedIndices.push(tIdx);
        lastMatched = tIdx;
        qIdx++;
      }
      tIdx++;
    }

    if (qIdx === q.length) {
      const score = Math.max(100, 400 - distancePenalty - (t.length - q.length));
      return { score, matchedIndices };
    }

    return null;
  }
}
