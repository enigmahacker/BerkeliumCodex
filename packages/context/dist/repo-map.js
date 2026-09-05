import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Tokenizer } from './tokenizer.js';
export class RepoMapper {
    workspaceRoot;
    fileCache = new Map();
    constructor(workspaceRoot = process.cwd()) {
        this.workspaceRoot = path.resolve(workspaceRoot);
    }
    async scan(maxFiles = 200) {
        const results = [];
        await this.walk(this.workspaceRoot, results, maxFiles);
        return results;
    }
    async generateRepoMap(maxTokens = 2000) {
        const files = await this.scan();
        const lines = ['# Repository Map'];
        for (const f of files) {
            const symbolsStr = f.symbols.length > 0
                ? ` (${f.symbols.slice(0, 5).map((s) => s.name).join(', ')})`
                : '';
            lines.push(`- ${f.path}${symbolsStr}`);
        }
        let result = lines.join('\n');
        if (Tokenizer.countTokens(result) > maxTokens) {
            // Condense if exceeds budget
            const condensed = lines.slice(0, Math.floor(lines.length / 2)).join('\n');
            result = `${condensed}\n... [${lines.length - Math.floor(lines.length / 2)} more files mapped]`;
        }
        return result;
    }
    async walk(dir, results, maxFiles) {
        if (results.length >= maxFiles)
            return;
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (results.length >= maxFiles)
                    break;
                const name = entry.name;
                if (name.startsWith('.') ||
                    name === 'node_modules' ||
                    name === 'dist' ||
                    name === 'build' ||
                    name === 'coverage' ||
                    name === 'target') {
                    continue;
                }
                const fullPath = path.join(dir, name);
                const relPath = path.relative(this.workspaceRoot, fullPath);
                if (entry.isDirectory()) {
                    await this.walk(fullPath, results, maxFiles);
                }
                else {
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
        }
        catch { }
    }
    isCodeFile(filename) {
        const ext = path.extname(filename).toLowerCase();
        const codeExtensions = new Set([
            '.ts', '.tsx', '.js', '.jsx', '.json', '.yaml', '.yml', '.toml',
            '.py', '.rs', '.go', '.c', '.cpp', '.h', '.java', '.kt', '.swift',
            '.md', '.sh', '.zsh', '.css', '.html',
        ]);
        return codeExtensions.has(ext);
    }
    async extractFileMetadata(fullPath, relPath) {
        try {
            const stat = await fs.stat(fullPath);
            if (stat.size > 2 * 1024 * 1024)
                return null; // Skip files > 2MB
            const content = await fs.readFile(fullPath, 'utf-8');
            const symbols = [];
            const imports = [];
            const exports = [];
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // Basic symbol extraction
                const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)/);
                if (funcMatch) {
                    symbols.push({ name: funcMatch[1], kind: 'function', line: i + 1 });
                }
                const classMatch = line.match(/(?:export\s+)?class\s+([A-Za-z0-9_$]+)/);
                if (classMatch) {
                    symbols.push({ name: classMatch[1], kind: 'class', line: i + 1 });
                }
                const interfaceMatch = line.match(/(?:export\s+)?interface\s+([A-Za-z0-9_$]+)/);
                if (interfaceMatch) {
                    symbols.push({ name: interfaceMatch[1], kind: 'interface', line: i + 1 });
                }
                const typeMatch = line.match(/(?:export\s+)?type\s+([A-Za-z0-9_$]+)/);
                if (typeMatch) {
                    symbols.push({ name: typeMatch[1], kind: 'type', line: i + 1 });
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
                exports,
                lastModified: stat.mtimeMs,
            };
        }
        catch {
            return null;
        }
    }
}
//# sourceMappingURL=repo-map.js.map