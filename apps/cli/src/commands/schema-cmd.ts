/**
 * Schema Command
 *
 * Inspects, exports, and validates Berkelium Codex Protocol Schemas.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { validateChatEvent } from '@berkelium/events';
import type { ThemeManager } from '@berkelium/themes';

export class SchemaCommand {
  static async run(
    themeManager: ThemeManager,
    subcommand?: string,
    targetFile?: string,
    workspaceRoot: string = process.cwd()
  ): Promise<void> {
    const formatted = themeManager.getFormatted();

    // Default: output chat protocol schema
    if (!subcommand || subcommand === 'chat') {
      const candidates = [
        resolve(workspaceRoot, 'schemas/chat.schema.json'),
        resolve(workspaceRoot, 'packages/events/schemas/chat.schema.json'),
        resolve(workspaceRoot, '../schemas/chat.schema.json'),
      ];

      let schemaContent: string | null = null;
      for (const p of candidates) {
        if (existsSync(p)) {
          schemaContent = readFileSync(p, 'utf-8');
          break;
        }
      }

      if (!schemaContent) {
        console.error(formatted.error('Error: chat.schema.json not found in repository.'));
        process.exit(1);
      }

      console.log(schemaContent);
      return;
    }

    if (subcommand === 'validate') {
      if (!targetFile) {
        console.error(formatted.error('Usage: bk schema validate <event-file.json>'));
        process.exit(1);
      }

      const filePath = resolve(workspaceRoot, targetFile);
      if (!existsSync(filePath)) {
        console.error(formatted.error(`Error: File not found at ${filePath}`));
        process.exit(1);
      }

      try {
        const raw = readFileSync(filePath, 'utf-8');
        const data = JSON.parse(raw);
        const result = validateChatEvent(data);

        if (result.valid) {
          console.log(formatted.success(`✓ Schema Validation Passed: ${targetFile} conforms to Berkelium Chat Protocol.`));
        } else {
          console.error(formatted.error(`✗ Schema Validation Failed (${result.errors.length} errors):`));
          for (const err of result.errors) {
            console.error(`  - ${err}`);
          }
          process.exit(1);
        }
      } catch (err: any) {
        console.error(formatted.error(`Error parsing JSON: ${err.message}`));
        process.exit(1);
      }
      return;
    }

    console.log(`
Berkelium Schema Tools

Usage:
  bk schema [chat]             Print the Berkelium Codex Chat Protocol JSON Schema
  bk schema validate <file>    Validate an event JSON file against the chat protocol schema
`);
  }
}
