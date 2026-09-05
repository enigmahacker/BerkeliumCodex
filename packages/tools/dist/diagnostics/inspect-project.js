import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';
export const InspectProjectInputSchema = z.object({});
export class InspectProjectTool {
    metadata = {
        name: 'inspect_project',
        description: 'Inspect and summarize project structure, language, manifests, dependencies, and configuration',
        category: 'diagnostics',
        risk: 'low',
        filesystem: { read: true },
    };
    schema = InspectProjectInputSchema;
    async execute(_args, context) {
        try {
            const summary = {
                workspace: context.workspaceRoot,
                type: 'unknown',
                manifests: [],
                scripts: {},
                frameworks: [],
            };
            const files = await fs.readdir(context.workspaceRoot);
            // Node / TypeScript project
            if (files.includes('package.json')) {
                summary.type = 'node/typescript';
                summary.manifests.push('package.json');
                try {
                    const pkg = JSON.parse(await fs.readFile(path.join(context.workspaceRoot, 'package.json'), 'utf-8'));
                    summary.scripts = pkg.scripts || {};
                    summary.dependencies = Object.keys(pkg.dependencies || {});
                    summary.devDependencies = Object.keys(pkg.devDependencies || {});
                }
                catch { }
            }
            // Rust project
            if (files.includes('Cargo.toml')) {
                summary.type = 'rust';
                summary.manifests.push('Cargo.toml');
            }
            // Python project
            if (files.includes('pyproject.toml') || files.includes('requirements.txt')) {
                summary.type = 'python';
                summary.manifests.push(files.includes('pyproject.toml') ? 'pyproject.toml' : 'requirements.txt');
            }
            // Go project
            if (files.includes('go.mod')) {
                summary.type = 'go';
                summary.manifests.push('go.mod');
            }
            const formatted = [
                `Project Type: ${summary.type}`,
                `Manifests: ${summary.manifests.join(', ') || 'none'}`,
                `Available Scripts: ${Object.keys(summary.scripts).join(', ') || 'none'}`,
            ].join('\n');
            return {
                success: true,
                output: formatted,
                data: summary,
            };
        }
        catch (err) {
            return {
                success: false,
                output: `Inspect project error: ${err.message}`,
                error: err.message,
            };
        }
    }
}
//# sourceMappingURL=inspect-project.js.map