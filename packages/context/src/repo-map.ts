import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { FileMetadata, SymbolDefinition } from './types.js';
import { Tokenizer } from './tokenizer.js';

const SYMBOL_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.rs', '.go', '.c', '.cpp', '.cc', '.h', '.hpp',
  '.java', '.kt', '.swift', '.sh', '.zsh',
]);

const SCAN_EXTENSIONS = new Set([
  ...SYMBOL_EXTENSIONS,
  '.json', '.yaml', '.yml', '.toml', '.md', '.css', '.html',
]);

const IGNORED_DIRECTORIES = new Set([
  'node_modules', 'dist', 'build', 'out', 'coverage', 'target',
  'tmp', 'temp', 'scratch', 'vendor', '__pycache__', 'Pods', 'DerivedData',
]);

const SCAN_CACHE_TTL_MS = 5000;
const MAX_FILES_PER_MAP_DIRECTORY = 4;
const MAX_SYMBOLS_PER_MAP_FILE = 3;

interface ScanCacheEntry {
  files: FileMetadata[];
  maxFiles: number;
  expiresAt: number;
}

export class RepoMapper {
  private workspaceRoot: string;
  private fileCache: Map<string, FileMetadata> = new Map();
  private scanCache: ScanCacheEntry | null = null;

  constructor(workspaceRoot = process.cwd()) {
    this.workspaceRoot = path.resolve(workspaceRoot);
  }

  /**
   * Scans the workspace, reusing a recent result to avoid re-reading every file
   * on each model iteration. Callers that create files should call invalidate().
   */
  public async scan(maxFiles = 500): Promise<FileMetadata[]> {
    const now = Date.now();
    if (this.scanCache && this.scanCache.maxFiles >= maxFiles && now < this.scanCache.expiresAt) {
      return this.scanCache.files;
    }

    const results: FileMetadata[] = [];
    await this.walk(this.workspaceRoot, results, maxFiles);
    this.scanCache = { files: results, maxFiles, expiresAt: now + SCAN_CACHE_TTL_MS };
    return results;
  }

  public invalidate(): void {
    this.scanCache = null;
  }

  public async generateRepoMap(maxTokens = 800): Promise<string> {
    const files = (await this.scan()).filter((f) => this.isSymbolFile(f.path));
    if (files.length === 0) {
      return '# Repository Map\n(No code files found)';
    }

    // Group files by directory
    const dirMap = new Map<string, Array<{ filename: string; symbols: string[] }>>();

    for (const f of files) {
      const dir = path.dirname(f.path);
      const filename = path.basename(f.path);
      const keySymbols = f.symbols.slice(0, MAX_SYMBOLS_PER_MAP_FILE).map((s) => s.name);

      if (!dirMap.has(dir)) {
        dirMap.set(dir, []);
      }
      dirMap.get(dir)!.push({ filename, symbols: keySymbols });
    }

    const header = '# Repository Map (Key Symbols)';
    const entries = Array.from(dirMap.entries()).map(([dir, dirFiles]) => ({ dir, dirFiles }));

    // Start with every directory present (paths are what locate code), then spend
    // any remaining budget upgrading the most important directories with symbols.
    const lines = entries.map(({ dir, dirFiles }) =>
      this.renderDirectoryLine(dir, dirFiles, false)
    );

    const fits = (candidate: string[]): boolean =>
      Tokenizer.countTokens([header, ...candidate].join('\n')) <= maxTokens;

    if (!fits(lines)) {
      const trimmed: string[] = [];
      for (const line of lines) {
        if (!fits([...trimmed, line])) {
          trimmed.push(`... [${lines.length - trimmed.length} more directories indexed]`);
          break;
        }
        trimmed.push(line);
      }
      return [header, ...trimmed].join('\n');
    }

    const upgradeOrder = entries
      .map((entry, index) => ({ index, priority: this.directoryPriority(entry.dir) }))
      .sort((a, b) => a.priority - b.priority || a.index - b.index);

    for (const { index } of upgradeOrder) {
      const { dir, dirFiles } = entries[index];
      const rich = this.renderDirectoryLine(dir, dirFiles, true);
      if (rich === lines[index]) continue;

      const previous = lines[index];
      lines[index] = rich;
      if (!fits(lines)) {
        lines[index] = previous;
      }
    }

    return [header, ...lines].join('\n');
  }

  private renderDirectoryLine(
    dir: string,
    dirFiles: Array<{ filename: string; symbols: string[] }>,
    withSymbols: boolean
  ): string {
    const shown = dirFiles.slice(0, MAX_FILES_PER_MAP_DIRECTORY);
    const summaries = shown.map((df) => {
      if (withSymbols && df.symbols.length > 0) {
        return `${df.filename} (${df.symbols.join(', ')})`;
      }
      return df.filename;
    });

    if (dirFiles.length > shown.length) {
      summaries.push(`+${dirFiles.length - shown.length} more`);
    }

    return `• ${dir}: ${summaries.join(', ')}`;
  }

  private directoryPriority(dir: string): number {
    if (dir.startsWith('packages/')) return 0;
    if (dir.startsWith('apps/')) return 1;
    if (dir.startsWith('tests/')) return 2;
    if (dir.startsWith('scripts/')) return 3;
    return 4;
  }


  private async walk(dir: string, results: FileMetadata[], maxFiles: number): Promise<void> {
    if (results.length >= maxFiles) return;

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (results.length >= maxFiles) break;

        const name = entry.name;
        if (name.startsWith('.') || IGNORED_DIRECTORIES.has(name)) {
          continue;
        }

        const fullPath = path.join(dir, name);
        const relPath = path.relative(this.workspaceRoot, fullPath);

        if (entry.isDirectory()) {
          await this.walk(fullPath, results, maxFiles);
        } else {
          // Process code/text files
          if (this.isCodeFile(name)) {
            const meta = await this.extractFileMetadata(fullPath, relPath);
            if (meta) {
              results.push(meta);
              this.fileCache.set(relPath, meta);
            }
          }
        }
      }
    } catch {}
  }

  private isCodeFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return SCAN_EXTENSIONS.has(ext);
  }

  private isSymbolFile(relativePath: string): boolean {
    const ext = path.extname(relativePath).toLowerCase();
    return SYMBOL_EXTENSIONS.has(ext);
  }

  private async extractFileMetadata(fullPath: string, relPath: string): Promise<FileMetadata | null> {
    try {
      const stat = await fs.stat(fullPath);
      if (stat.size > 2 * 1024 * 1024) return null; // Skip files > 2MB

      const content = await fs.readFile(fullPath, 'utf-8');
      const symbols: SymbolDefinition[] = [];
      const imports: string[] = [];
      const extractSymbols = this.isSymbolFile(relPath);

      const lines = content.split('\n');
      for (let i = 0; i < lines.length && extractSymbols; i++) {
        const line = lines[i];

        // Basic symbol extraction, anchored to declarations rather than prose
        const funcMatch = line.match(/^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)/);
        if (funcMatch) {
          symbols.push({ name: funcMatch[1], kind: 'function', line: i + 1 });
        }

        const classMatch = line.match(/^\s*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z0-9_$]+)/);
        if (classMatch) {
          symbols.push({ name: classMatch[1], kind: 'class', line: i + 1 });
        }

        const interfaceMatch = line.match(/^\s*(?:export\s+)?interface\s+([A-Za-z0-9_$]+)/);
        if (interfaceMatch) {
          symbols.push({ name: interfaceMatch[1], kind: 'interface', line: i + 1 });
        }

        const enumMatch = line.match(/^\s*(?:export\s+)?enum\s+([A-Za-z0-9_$]+)/);
        if (enumMatch) {
          symbols.push({ name: enumMatch[1], kind: 'type', line: i + 1 });
        }

        const constMatch = line.match(/^\s*export\s+(?:const|let)\s+([A-Za-z0-9_$]+)\s*[:=]/);
        if (constMatch && !['default', 'from', 'as'].includes(constMatch[1])) {
          symbols.push({ name: constMatch[1], kind: 'variable', line: i + 1 });
        }

        // Imports
        const importMatch = line.match(/import\s+.*?from\s+['"](.*?)['"]/);
        if (importMatch) {
          imports.push(importMatch[1]);
        }
      }

      return {
        path: relPath,
        size: stat.size,
        tokens: Tokenizer.countTokens(content),
        symbols,
        imports,
        lastModified: stat.mtimeMs,
      };
    } catch {
      return null;
    }
  }
}
