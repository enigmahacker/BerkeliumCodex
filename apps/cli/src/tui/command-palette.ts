import { ThemeManager, stripAnsi } from '@berkelium/themes';
import { CommandMatchResult, ArgumentMatchResult, CommandCategory } from '../commands/types.js';

export interface CommandPaletteOptions {
  themeManager: ThemeManager;
  maxVisibleItems?: number;
}

export class CommandPaletteRenderer {
  private themeManager: ThemeManager;
  private maxVisibleItems: number;

  constructor(options: CommandPaletteOptions) {
    this.themeManager = options.themeManager;
    this.maxVisibleItems = options.maxVisibleItems || 10;
  }

  /**
   * Helper to format a box row with exact padding and right border alignment.
   */
  private formatBoxRow(content: string, innerWidth: number): string {
    const visibleLen = stripAnsi(content).length;
    const pad = Math.max(0, innerWidth - visibleLen);
    return `│ ${content}${' '.repeat(pad)} │`;
  }

  /**
   * Render the command suggestions pop-up panel.
   */
  public renderCommandSuggestions(
    matches: CommandMatchResult[],
    selectedIndex: number,
    scrollOffset: number,
    query: string
  ): string[] {
    const fmt = this.themeManager.getFormatted();
    const lines: string[] = [];

    const termCols = process.stdout.columns || 80;
    const boxWidth = Math.min(termCols, 76);
    const innerWidth = boxWidth - 4;

    // Header
    const cleanQuery = query.replace(/^\//, '');
    const title = cleanQuery ? `COMMANDS: "/${cleanQuery}"` : 'COMMANDS';
    const headerBorder = `╭─ ${fmt.bold(fmt.primary(title))} ${'─'.repeat(Math.max(0, boxWidth - title.length - 5))}╮`;
    lines.push(headerBorder);

    if (matches.length === 0) {
      lines.push(
        this.formatBoxRow(fmt.dimmed('No matching commands found. Press Esc to close.'), innerWidth)
      );
      lines.push(`╰${'─'.repeat(boxWidth - 2)}╯`);
      return lines;
    }

    const visibleMatches = matches.slice(
      scrollOffset,
      scrollOffset + this.maxVisibleItems
    );

    for (let i = 0; i < visibleMatches.length; i++) {
      const matchIndex = scrollOffset + i;
      const isSelected = matchIndex === selectedIndex;
      const item = visibleMatches[i];
      const cmd = item.command;

      const prefix = isSelected ? fmt.primary(fmt.bold(' › ')) : '   ';

      // Highlight matched characters in command name
      let highlightedCmd = '';
      const matchedSet = new Set(item.matchedIndices);
      for (let cIdx = 0; cIdx < cmd.name.length; cIdx++) {
        const ch = cmd.name[cIdx];
        if (matchedSet.has(cIdx)) {
          highlightedCmd += fmt.accent(fmt.bold(ch));
        } else {
          highlightedCmd += isSelected ? fmt.primary(ch) : fmt.muted(ch);
        }
      }

      const displayCmd = isSelected ? fmt.bold(`/${highlightedCmd}`) : `/${highlightedCmd}`;
      const cmdVisibleLen = stripAnsi(displayCmd).length;
      const cmdPad = Math.max(1, 20 - cmdVisibleLen);
      const spacedCmd = displayCmd + ' '.repeat(cmdPad);

      const desc = cmd.description;
      const maxDescLen = Math.max(10, innerWidth - 3 - 20 - 1);
      const truncatedDesc =
        desc.length > maxDescLen ? desc.slice(0, maxDescLen - 3) + '...' : desc;
      const styledDesc = isSelected ? fmt.muted(truncatedDesc) : fmt.dimmed(truncatedDesc);

      const rowContent = `${prefix}${spacedCmd} ${styledDesc}`;
      lines.push(this.formatBoxRow(rowContent, innerWidth));
    }

    // Scroll indicator if matches exceed max visible items
    if (matches.length > this.maxVisibleItems) {
      const scrollInfo = fmt.dimmed(`(${selectedIndex + 1}/${matches.length})`);
      lines.push(this.formatBoxRow(scrollInfo, innerWidth));
    }

    // Selected item usage preview
    const selectedItem = matches[selectedIndex];
    if (selectedItem && selectedItem.command.usage) {
      lines.push(`├${'─'.repeat(boxWidth - 2)}┤`);
      const usageStr = `${fmt.dimmed('Usage:')} ${fmt.accent(selectedItem.command.usage)}`;
      lines.push(this.formatBoxRow(usageStr, innerWidth));
    }

    // Footer
    lines.push(`╰${'─'.repeat(boxWidth - 2)}╯`);
    lines.push(
      fmt.dimmed('  ↑↓ Navigate • Tab Complete • Enter Select • Esc Close')
    );

    return lines;
  }

  /**
   * Render dynamic argument suggestions pop-up panel (e.g. models, providers, themes).
   */
  public renderArgumentSuggestions(
    commandName: string,
    argName: string,
    matches: ArgumentMatchResult[],
    selectedIndex: number,
    scrollOffset: number,
    query: string
  ): string[] {
    const fmt = this.themeManager.getFormatted();
    const lines: string[] = [];

    const termCols = process.stdout.columns || 80;
    const boxWidth = Math.min(termCols, 76);
    const innerWidth = boxWidth - 4;

    const title = `${argName.toUpperCase()}S: "/${commandName} ${query}"`;
    lines.push(`╭─ ${fmt.bold(fmt.primary(title))} ${'─'.repeat(Math.max(0, boxWidth - title.length - 5))}╮`);

    if (matches.length === 0) {
      lines.push(
        this.formatBoxRow(fmt.dimmed('No matching options. Type custom value or Esc to close.'), innerWidth)
      );
      lines.push(`╰${'─'.repeat(boxWidth - 2)}╯`);
      return lines;
    }

    const visibleMatches = matches.slice(
      scrollOffset,
      scrollOffset + this.maxVisibleItems
    );

    for (let i = 0; i < visibleMatches.length; i++) {
      const matchIndex = scrollOffset + i;
      const isSelected = matchIndex === selectedIndex;
      const item = visibleMatches[i];

      const prefix = isSelected ? fmt.primary(fmt.bold(' › ')) : '   ';

      // Highlight matched characters in argument value
      let highlightedVal = '';
      const matchedSet = new Set(item.matchedIndices);
      for (let cIdx = 0; cIdx < item.value.length; cIdx++) {
        const ch = item.value[cIdx];
        if (matchedSet.has(cIdx)) {
          highlightedVal += fmt.accent(fmt.bold(ch));
        } else {
          highlightedVal += isSelected ? fmt.primary(ch) : fmt.muted(ch);
        }
      }

      const displayVal = isSelected ? fmt.bold(highlightedVal) : highlightedVal;
      const valVisibleLen = stripAnsi(displayVal).length;
      const valPad = Math.max(1, 24 - valVisibleLen);
      const spacedVal = displayVal + ' '.repeat(valPad);

      const desc = item.description || '';
      const maxDescLen = Math.max(10, innerWidth - 3 - 24 - 1);
      const truncatedDesc =
        desc.length > maxDescLen ? desc.slice(0, maxDescLen - 3) + '...' : desc;
      const styledDesc = isSelected ? fmt.muted(truncatedDesc) : fmt.dimmed(truncatedDesc);

      const rowContent = `${prefix}${spacedVal} ${styledDesc}`;
      lines.push(this.formatBoxRow(rowContent, innerWidth));
    }

    if (matches.length > this.maxVisibleItems) {
      const scrollInfo = fmt.dimmed(`(${selectedIndex + 1}/${matches.length})`);
      lines.push(this.formatBoxRow(scrollInfo, innerWidth));
    }

    lines.push(`╰${'─'.repeat(boxWidth - 2)}╯`);
    lines.push(
      fmt.dimmed('  ↑↓ Navigate • Tab/Enter Select • Esc Close')
    );

    return lines;
  }
}
