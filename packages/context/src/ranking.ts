import { FileMetadata, RankedFile } from './types.js';

export class FileRanker {
  public static rankFiles(
    query: string,
    files: FileMetadata[],
    activeFiles: Set<string> = new Set()
  ): RankedFile[] {
    const terms = query
      .toLowerCase()
      .split(/[\s\-_/\\.:,;]+/)
      .filter((t) => t.length > 2);

    const ranked: RankedFile[] = [];

    for (const file of files) {
      let score = 0;
      const reasons: string[] = [];
      const lowerPath = file.path.toLowerCase();
      let matchedQuery = false;

      // 1. Exact or substring match in path
      for (const term of terms) {
        if (lowerPath.includes(term)) {
          score += 20;
          matchedQuery = true;
          reasons.push(`path matches term "${term}"`);
        }
      }

      // 2. Symbol matches
      for (const sym of file.symbols) {
        const lowerSym = sym.name.toLowerCase();
        for (const term of terms) {
          if (lowerSym === term) {
            score += 30;
            matchedQuery = true;
            reasons.push(`exact symbol "${sym.name}"`);
          } else if (lowerSym.includes(term)) {
            score += 15;
            matchedQuery = true;
            reasons.push(`symbol contains "${term}"`);
          }
        }
      }

      // Activity and recency only break ties between query-relevant files;
      // they must not surface every recently touched file for an unrelated query.
      if (matchedQuery) {
        if (activeFiles.has(file.path)) {
          score += 50;
          reasons.push('active in recent session');
        }

        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        if (file.lastModified > oneDayAgo) {
          score += 10;
          reasons.push('recently modified');
        }
      }

      if (matchedQuery) {
        ranked.push({
          path: file.path,
          score,
          reasons,
          topSymbols: file.symbols.slice(0, 4).map((s) => s.name),
        });
      }
    }

    return ranked.sort((a, b) => b.score - a.score);
  }
}
