import * as fs from 'node:fs/promises';
import * as path from 'node:path';
export class InitCommand {
    static async run(themeManager, workspaceRoot = process.cwd()) {
        const fmt = themeManager.getFormatted();
        const berkeliumDir = path.join(workspaceRoot, '.berkelium');
        console.log();
        console.log(fmt.primary(fmt.bold('Initializing Berkelium Project Configuration...')));
        try {
            await fs.mkdir(berkeliumDir, { recursive: true });
            await fs.mkdir(path.join(berkeliumDir, 'prompts'), { recursive: true });
            await fs.mkdir(path.join(berkeliumDir, 'agents'), { recursive: true });
            await fs.mkdir(path.join(berkeliumDir, 'workflows'), { recursive: true });
            // 1. .berkelium/config.yaml
            const configYaml = `version: 1
default_model: coding
theme:
  name: berkelium-dark
ui:
  launch_animation: true
  hackathon_mode: false
permissions:
  filesystem:
    read: allow
    write:
      workspace: allow
      outside_workspace: ask
    delete:
      workspace: ask
      outside_workspace: deny
  shell:
    safe: allow
    destructive: ask
`;
            await fs.writeFile(path.join(berkeliumDir, 'config.yaml'), configYaml, 'utf-8');
            // 2. .berkelium/system.md
            const systemMd = `# Project Instructions for Berkelium

- Project-specific guidelines, architecture rules, and coding standards.
- Add architectural notes here to guide Berkelium when solving tasks in this workspace.
`;
            await fs.writeFile(path.join(berkeliumDir, 'system.md'), systemMd, 'utf-8');
            console.log(fmt.success('✓ Created .berkelium/config.yaml'));
            console.log(fmt.success('✓ Created .berkelium/system.md'));
            console.log(fmt.success('✓ Created .berkelium/prompts/ directory'));
            console.log(fmt.success('✓ Created .berkelium/agents/ directory'));
            console.log();
            console.log(fmt.bold(fmt.accent('Berkelium initialized successfully.')));
            console.log(fmt.dimmed('Run `berkelium` to launch the interactive development workstation.'));
            console.log();
        }
        catch (err) {
            console.log(fmt.error(`Failed to initialize project: ${err.message}`));
        }
    }
}
//# sourceMappingURL=init.js.map