import { ThemeManager } from '@berkelium/themes';
import { RepoMapper } from '@berkelium/context';

export class SearchCommand {
  public static async run(
    themeManager: ThemeManager,
    query?: string,
    workspaceRoot: string = process.cwd()
  ): Promise<void> {
    const fmt = themeManager.getFormatted();

    if (!query) {
      console.log(fmt.error('Usage: berkelium search <query>'));
      console.log(fmt.dimmed('Example: berkelium search ProviderRouter'));
      return;
    }

    const mapper = new RepoMapper(workspaceRoot);
    const files = await mapper.scan(500);

    const lowerQ = query.toLowerCase();
    const results: Array<{ path: string; matchingSymbols: string[] }> = [];

    for (const f of files) {
      const matchingSymbols = f.symbols
        .filter((s) => s.name.toLowerCase().includes(lowerQ))
        .map((s) => `${s.kind} ${s.name}`);

      if (matchingSymbols.length > 0 || f.path.toLowerCase().includes(lowerQ)) {
        results.push({ path: f.path, matchingSymbols });
      }
    }

    console.log();
    console.log(fmt.bold(fmt.primary(`SEARCH RESULTS FOR "${query}"`)));
    console.log(fmt.dimmed(`Found ${results.length} matching files`));
    console.log();

    if (results.length === 0) {
      console.log(fmt.dimmed('  No matching symbols or file paths found.'));
    } else {
      for (const res of results.slice(0, 20)) {
        console.log(`  • ${fmt.bold(fmt.accent(res.path))}`);
        if (res.matchingSymbols.length > 0) {
          console.log(`    ${fmt.dimmed(res.matchingSymbols.join(', '))}`);
        }
      }
      if (results.length > 20) {
        console.log(fmt.dimmed(`  ... and ${results.length - 20} more results.`));
      }
    }
    console.log();
  }
}
