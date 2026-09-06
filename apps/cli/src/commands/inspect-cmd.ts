import * as fs from 'node:fs';
import * as path from 'node:path';
import { ThemeManager } from '@berkelium/themes';
import { Tokenizer } from '@berkelium/context';
import { RepoMapper } from '@berkelium/context';

export class InspectCommand {
  public static async run(
    themeManager: ThemeManager,
    filePath?: string,
    workspaceRoot: string = process.cwd()
  ): Promise<void> {
    const fmt = themeManager.getFormatted();

    if (!filePath) {
      console.log(fmt.error('Usage: berkelium inspect <file_path>'));
      console.log(fmt.dimmed('Example: berkelium inspect packages/providers/src/router.ts'));
      return;
    }

    const resolved = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(workspaceRoot, filePath);

    if (!fs.existsSync(resolved)) {
      console.log(fmt.error(`File not found: ${filePath}`));
      return;
    }

    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      console.log(fmt.error(`Path is a directory: ${filePath}. Use "berkelium map" to inspect directories.`));
      return;
    }

    const content = fs.readFileSync(resolved, 'utf-8');
    const lines = content.split('\n');
    const tokenCount = Tokenizer.countTokens(content);
    const sizeKB = (stat.size / 1024).toFixed(1);

    // Extract symbols using RepoMapper internal analyzer
    const mapper = new RepoMapper(workspaceRoot);
    const scanned = await mapper.scan(500);
    const rel = path.relative(workspaceRoot, resolved);
    const meta = scanned.find((f) => f.path === rel || f.path.endsWith(path.basename(rel)));

    console.log();
    console.log(fmt.bold(fmt.primary(`FILE INSPECTION: ${path.basename(resolved)}`)));
    console.log(`  Path:        ${fmt.dimmed(rel)}`);
    console.log(`  Size:        ${fmt.bold(sizeKB + ' KB')} (${stat.size} bytes)`);
    console.log(`  Lines:       ${fmt.bold(String(lines.length))}`);
    console.log(`  Tokens:      ${fmt.primary(tokenCount.toLocaleString())} tokens`);
    console.log(`  Permissions: ${fmt.success('Read-allowed')}`);
    console.log();

    if (meta && meta.symbols.length > 0) {
      console.log(fmt.accent('DETECTED SYMBOLS:'));
      for (const sym of meta.symbols) {
        console.log(`  • [${fmt.dimmed(sym.kind)}] ${fmt.bold(sym.name)} (line ${sym.line})`);
      }
      console.log();
    }

    console.log(fmt.accent('CONTENT PREVIEW (First 15 lines):'));
    console.log(fmt.border('─'.repeat(50)));
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      const lineNum = String(i + 1).padStart(3, '0');
      console.log(`${fmt.dimmed(lineNum + ' │')} ${lines[i]}`);
    }
    if (lines.length > 15) {
      console.log(fmt.dimmed(`... │ and ${lines.length - 15} more lines`));
    }
    console.log(fmt.border('─'.repeat(50)));
    console.log();
  }
}
