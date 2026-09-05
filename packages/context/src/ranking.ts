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

      // 1. Active file boost
      if (activeFiles.has(file.path)) {
        score += 50;
        reasons.push('active in recent session');
      }

      // 2. Exact or substring match in path
      for (const term of terms) {
        if (lowerPath.includes(term)) {
          score += 20;
          reasons.push(`path matches term "${term}"`);
        }
      }

      // 3. Symbol matches
      for (const sym of file.symbols) {
        const lowerSym = sym.name.toLowerCase();
        for (const term of terms) {
          if (lowerSym === term) {
            score += 30;
            reasons.push(`exact symbol "${sym.name}"`);
          } else if (lowerSym.includes(term)) {
            score += 15;
            reasons.push(`symbol contains "${term}"`);
          }
        }
      }

      // 4. Recency boost (modified in last 24 hours)
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      if (file.lastModified > oneDayAgo) {
        score += 10;
        reasons.push('recently modified');
      }

      if (score > 0) {
        ranked.push({
          path: file.path,
          score,
          reasons,
        });
      }
    }

    return ranked.sort((a, b) => b.score - a.score);
  }
}
