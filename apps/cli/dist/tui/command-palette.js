export class CommandPaletteRenderer {
    themeManager;
    maxVisibleItems;
    constructor(options) {
        this.themeManager = options.themeManager;
        this.maxVisibleItems = options.maxVisibleItems || 10;
    }
    /**
     * Render the command suggestions panel.
     */
    renderCommandSuggestions(matches, selectedIndex, scrollOffset, query) {
        const fmt = this.themeManager.getFormatted();
        const lines = [];
        const boxWidth = 72;
        const innerWidth = boxWidth - 4;
        // Header
        const title = query ? `COMMANDS: "/${query.replace(/^\//, '')}"` : 'COMMANDS';
        const headerBorder = `╭─ ${fmt.bold(fmt.primary(title))} ${'─'.repeat(Math.max(0, boxWidth - title.length - 5))}╮`;
        lines.push(headerBorder);
        if (matches.length === 0) {
            lines.push(`│  ${fmt.dimmed('No matching commands found. Press Esc to close.')}${' '.repeat(Math.max(0, innerWidth - 44))}│`);
            lines.push(`╰${'─'.repeat(boxWidth - 2)}╯`);
            return lines;
        }
        const visibleMatches = matches.slice(scrollOffset, scrollOffset + this.maxVisibleItems);
        let lastCategory = null;
        for (let i = 0; i < visibleMatches.length; i++) {
            const matchIndex = scrollOffset + i;
            const isSelected = matchIndex === selectedIndex;
            const item = visibleMatches[i];
            const cmd = item.command;
            // Category divider if grouping
            if (cmd.category !== lastCategory && matches.length > 5) {
                lastCategory = cmd.category;
                const catBadge = fmt.dimmed(`[${cmd.category}]`);
                // lines.push(`│ ${catBadge} ${' '.repeat(Math.max(0, innerWidth - cmd.category.length - 3))}│`);
            }
            const prefix = isSelected ? fmt.primary(fmt.bold(' › ')) : '   ';
            const cmdName = '/' + cmd.name;
            // Highlight matched characters
            let highlightedCmd = '';
            const matchedSet = new Set(item.matchedIndices);
            for (let cIdx = 0; cIdx < cmd.name.length; cIdx++) {
                const ch = cmd.name[cIdx];
                if (matchedSet.has(cIdx)) {
                    highlightedCmd += fmt.accent(fmt.bold(ch));
                }
                else {
                    highlightedCmd += isSelected ? fmt.primary(ch) : fmt.muted(ch);
                }
            }
            const displayCmd = isSelected
                ? fmt.bold(`/${highlightedCmd}`)
                : `/${highlightedCmd}`;
            const rawCmdStr = cmdName.padEnd(20, ' ');
            const desc = cmd.description;
            const maxDescLen = innerWidth - 24;
            const truncatedDesc = desc.length > maxDescLen ? desc.slice(0, maxDescLen - 3) + '...' : desc;
            const styledDesc = isSelected ? fmt.muted(truncatedDesc) : fmt.dimmed(truncatedDesc);
            const content = `${prefix}${displayCmd.padEnd(isSelected ? 28 : 20, ' ')} ${styledDesc}`;
            lines.push(`│ ${content}${' '.repeat(Math.max(0, innerWidth - rawCmdStr.length - truncatedDesc.length - 4))}│`);
        }
        // Scroll indicator if needed
        if (matches.length > this.maxVisibleItems) {
            const scrollInfo = `(${selectedIndex + 1}/${matches.length})`;
            const scrollPad = Math.max(0, innerWidth - scrollInfo.length);
            lines.push(`│ ${fmt.dimmed(scrollInfo)}${' '.repeat(scrollPad)} │`);
        }
        // Selected item usage preview
        const selectedItem = matches[selectedIndex];
        if (selectedItem && selectedItem.command.usage) {
            lines.push(`├${'─'.repeat(boxWidth - 2)}┤`);
            const usageStr = fmt.dimmed(`Usage: ${selectedItem.command.usage}`);
            lines.push(`│  ${usageStr}${' '.repeat(Math.max(0, innerWidth - selectedItem.command.usage.length - 8))}│`);
        }
        // Footer
        lines.push(`╰${'─'.repeat(boxWidth - 2)}╯`);
        lines.push(fmt.dimmed('  ↑↓ Navigate • Tab Complete • Enter Select • Esc Close'));
        return lines;
    }
    /**
     * Render dynamic argument suggestions panel (e.g. models, providers, themes).
     */
    renderArgumentSuggestions(commandName, argName, matches, selectedIndex, scrollOffset, query) {
        const fmt = this.themeManager.getFormatted();
        const lines = [];
        const boxWidth = 72;
        const innerWidth = boxWidth - 4;
        const title = `${argName.toUpperCase()}S: "/${commandName} ${query}"`;
        lines.push(`╭─ ${fmt.bold(fmt.primary(title))} ${'─'.repeat(Math.max(0, boxWidth - title.length - 5))}╮`);
        if (matches.length === 0) {
            lines.push(`│  ${fmt.dimmed('No matching options found. Type custom value or Esc to close.')}${' '.repeat(Math.max(0, innerWidth - 59))}│`);
            lines.push(`╰${'─'.repeat(boxWidth - 2)}╯`);
            return lines;
        }
        const visibleMatches = matches.slice(scrollOffset, scrollOffset + this.maxVisibleItems);
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
                }
                else {
                    highlightedVal += isSelected ? fmt.primary(ch) : fmt.muted(ch);
                }
            }
            const displayVal = isSelected ? fmt.bold(highlightedVal) : highlightedVal;
            const rawValStr = item.value.padEnd(28, ' ');
            const desc = item.description || '';
            const maxDescLen = innerWidth - 32;
            const truncatedDesc = desc.length > maxDescLen ? desc.slice(0, maxDescLen - 3) + '...' : desc;
            const styledDesc = isSelected ? fmt.muted(truncatedDesc) : fmt.dimmed(truncatedDesc);
            const content = `${prefix}${displayVal.padEnd(isSelected ? 36 : 28, ' ')} ${styledDesc}`;
            lines.push(`│ ${content}${' '.repeat(Math.max(0, innerWidth - item.value.length - truncatedDesc.length - 5))}│`);
        }
        if (matches.length > this.maxVisibleItems) {
            const scrollInfo = `(${selectedIndex + 1}/${matches.length})`;
            const scrollPad = Math.max(0, innerWidth - scrollInfo.length);
            lines.push(`│ ${fmt.dimmed(scrollInfo)}${' '.repeat(scrollPad)} │`);
        }
        lines.push(`╰${'─'.repeat(boxWidth - 2)}╯`);
        lines.push(fmt.dimmed('  ↑↓ Navigate • Tab/Enter Select • Esc Close'));
        return lines;
    }
}
//# sourceMappingURL=command-palette.js.map