import { RepoMapper, Tokenizer } from '@berkelium/context';
export class MapCommand {
    static async run(themeManager, workspaceRoot = process.cwd(), maxTokens = 1000) {
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
//# sourceMappingURL=map-cmd.js.map