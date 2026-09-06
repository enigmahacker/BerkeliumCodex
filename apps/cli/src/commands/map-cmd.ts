import { ThemeManager } from '@berkelium/themes';
import { RepoMapper, Tokenizer } from '@berkelium/context';

export class MapCommand {
  public static async run(
    themeManager: ThemeManager,
    workspaceRoot: string = process.cwd(),
    maxTokens: number = 1000
  ): Promise<void> {
    const fmt = themeManager.getFormatted();
    const mapper = new RepoMapper(workspaceRoot);

    console.log();
    console.log(fmt.bold(fmt.primary('REPOSITORY SYMBOL MAP')));
    console.log(fmt.dimmed(`Workspace: ${workspaceRoot}`));
    console.log();

    const repoMap = await mapper.generateRepoMap(maxTokens);
    const tokenCount = Tokenizer.countTokens(repoMap);

    console.log(repoMap);
    console.log();
    console.log(fmt.dimmed(`Token density: ${tokenCount} tokens (budget: ${maxTokens})`));
    console.log();
  }
}
