import { CommandRegistry } from '../commands/registry.js';
import { CommandMatcher } from '../commands/matcher.js';
import { CompletionEngine } from '../commands/completion.js';
import { CommandExecutionContext, CommandMatchResult, ArgumentMatchResult, CommandDefinition } from '../commands/types.js';

export type InputMode = 'Normal' | 'SlashCommand' | 'SlashArgument' | 'Multiline';

export interface KeypressPayload {
  sequence?: string;
  name?: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
}

export interface InputStateResult {
  buffer: string;
  cursorPosition: number;
  mode: InputMode;
  shouldRenderPalette: boolean;
  commandMatches: CommandMatchResult[];
  argumentMatches: ArgumentMatchResult[];
  selectedIndex: number;
  scrollOffset: number;
  activeCommand?: CommandDefinition;
  submittedInput?: string;
  cancelled?: boolean;
}

export class InputStateMachine {
  private mode: InputMode = 'Normal';
  private buffer = '';
  private cursorPosition = 0;
  private selectedIndex = 0;
  private scrollOffset = 0;
  private maxVisibleItems = 10;
  private registry: CommandRegistry;
  private executionContext: CommandExecutionContext;

  private currentCommandMatches: CommandMatchResult[] = [];
  private currentArgumentMatches: ArgumentMatchResult[] = [];
  private activeCommandDef?: CommandDefinition;
  private activeArgIndex = 0;

  constructor(context: CommandExecutionContext) {
    this.executionContext = context;
    this.registry = CommandRegistry.getInstance();
    this.registry.loadCustomCommands(context.configManager.getWorkspaceRoot());
  }

  public getMode(): InputMode {
    return this.mode;
  }

  public getBuffer(): string {
    return this.buffer;
  }

  public setBuffer(buf: string): void {
    this.buffer = buf;
    this.cursorPosition = buf.length;
    this.recomputeState();
  }

  public reset(): void {
    this.mode = 'Normal';
    this.buffer = '';
    this.cursorPosition = 0;
    this.selectedIndex = 0;
    this.scrollOffset = 0;
    this.currentCommandMatches = [];
    this.currentArgumentMatches = [];
    this.activeCommandDef = undefined;
  }

  /**
   * Handle incoming raw keystroke from TTY interface.
   */
  public async handleKeypress(char: string | undefined, key: KeypressPayload | undefined): Promise<InputStateResult> {
    const keyName = key?.name || '';
    const isCtrl = Boolean(key?.ctrl);

    // 1. Ctrl+C Cancel
    if (isCtrl && keyName === 'c') {
      this.reset();
      return this.buildResult({ cancelled: true });
    }

    // 2. Escape: close palette, retain input buffer, revert to Normal mode
    if (keyName === 'escape') {
      if (this.mode === 'SlashCommand' || this.mode === 'SlashArgument') {
        this.mode = 'Normal';
        this.selectedIndex = 0;
        this.scrollOffset = 0;
        return this.buildResult();
      }
    }

    // 3. Arrow Up / Down navigation
    if (this.mode === 'SlashCommand' || this.mode === 'SlashArgument') {
      const totalItems =
        this.mode === 'SlashCommand'
          ? this.currentCommandMatches.length
          : this.currentArgumentMatches.length;

      if (keyName === 'up') {
        if (totalItems > 0) {
          this.selectedIndex = (this.selectedIndex - 1 + totalItems) % totalItems;
          this.adjustScroll(totalItems);
        }
        return this.buildResult();
      }

      if (keyName === 'down') {
        if (totalItems > 0) {
          this.selectedIndex = (this.selectedIndex + 1) % totalItems;
          this.adjustScroll(totalItems);
        }
        return this.buildResult();
      }

      if (keyName === 'home') {
        this.selectedIndex = 0;
        this.scrollOffset = 0;
        return this.buildResult();
      }

      if (keyName === 'end') {
        this.selectedIndex = Math.max(0, totalItems - 1);
        this.adjustScroll(totalItems);
        return this.buildResult();
      }
    }

    // 4. Tab: Complete without executing
    if (keyName === 'tab') {
      if (this.mode === 'SlashCommand' && this.currentCommandMatches.length > 0) {
        const selected = this.currentCommandMatches[this.selectedIndex];
        if (selected) {
          const cmd = selected.command;
          const hasArgs = cmd.arguments && cmd.arguments.length > 0;
          this.buffer = `/${cmd.name}${hasArgs ? ' ' : ''}`;
          this.cursorPosition = this.buffer.length;
          await this.recomputeState();
          return this.buildResult();
        }
      }

      if (this.mode === 'SlashArgument' && this.currentArgumentMatches.length > 0) {
        const selected = this.currentArgumentMatches[this.selectedIndex];
        if (selected && this.activeCommandDef) {
          const parts = this.buffer.trimStart().split(/\s+/);
          const cmdPart = parts[0];
          this.buffer = `${cmdPart} ${selected.value}`;
          this.cursorPosition = this.buffer.length;
          await this.recomputeState();
          return this.buildResult();
        }
      }
    }

    // 5. Enter: Submit or Select
    if (keyName === 'return' || keyName === 'enter') {
      // If in SlashCommand mode and selecting a command requiring arguments
      if (this.mode === 'SlashCommand' && this.currentCommandMatches.length > 0) {
        const selected = this.currentCommandMatches[this.selectedIndex];
        if (selected) {
          const cmd = selected.command;
          const hasArgs = cmd.arguments && cmd.arguments.some((a) => a.required);
          if (hasArgs) {
            // Populate command + space into buffer, do not execute yet
            this.buffer = `/${cmd.name} `;
            this.cursorPosition = this.buffer.length;
            await this.recomputeState();
            return this.buildResult();
          }
        }
      }

      // If in SlashArgument and an argument option is highlighted
      if (this.mode === 'SlashArgument' && this.currentArgumentMatches.length > 0) {
        const parts = this.buffer.trimStart().split(/\s+/);
        // If user hasn't typed a full argument yet, complete it on enter
        if (parts.length <= 2 && parts[1] === '') {
          const selected = this.currentArgumentMatches[this.selectedIndex];
          if (selected) {
            this.buffer = `${parts[0]} ${selected.value}`;
          }
        }
      }

      const submitted = this.buffer;
      this.reset();
      return this.buildResult({ submittedInput: submitted });
    }

    // 6. Backspace
    if (keyName === 'backspace') {
      if (this.cursorPosition > 0) {
        this.buffer =
          this.buffer.slice(0, this.cursorPosition - 1) +
          this.buffer.slice(this.cursorPosition);
        this.cursorPosition--;
        await this.recomputeState();
      }
      return this.buildResult();
    }

    // 7. Standard Character Input
    if (char && char.length === 1 && !isCtrl) {
      this.buffer =
        this.buffer.slice(0, this.cursorPosition) +
        char +
        this.buffer.slice(this.cursorPosition);
      this.cursorPosition++;
      await this.recomputeState();
      return this.buildResult();
    }

    return this.buildResult();
  }

  private async recomputeState(): Promise<void> {
    const trimmedLeading = this.buffer.trimStart();

    // Check if starts with slash
    if (!trimmedLeading.startsWith('/')) {
      this.mode = 'Normal';
      this.currentCommandMatches = [];
      this.currentArgumentMatches = [];
      this.activeCommandDef = undefined;
      return;
    }

    const afterSlash = trimmedLeading.slice(1);
    const spaceIndex = afterSlash.indexOf(' ');

    if (spaceIndex === -1) {
      // 1. SlashCommand Mode (typing command name)
      this.mode = 'SlashCommand';
      const allCommands = this.registry.list();
      this.currentCommandMatches = CommandMatcher.matchCommands(allCommands, afterSlash);
      this.selectedIndex = Math.min(this.selectedIndex, Math.max(0, this.currentCommandMatches.length - 1));
      this.activeCommandDef = this.currentCommandMatches[this.selectedIndex]?.command;
      this.currentArgumentMatches = [];
    } else {
      // 2. SlashArgument Mode (typing command arguments)
      this.mode = 'SlashArgument';
      const commandName = afterSlash.slice(0, spaceIndex);
      const argQuery = afterSlash.slice(spaceIndex + 1);

      const cmd = this.registry.get(commandName);
      if (cmd && cmd.arguments && cmd.arguments.length > 0) {
        this.activeCommandDef = cmd;
        this.activeArgIndex = 0;
        this.currentArgumentMatches = await CompletionEngine.getArgumentSuggestions(
          this.executionContext,
          cmd,
          this.activeArgIndex,
          argQuery
        );
        this.selectedIndex = Math.min(this.selectedIndex, Math.max(0, this.currentArgumentMatches.length - 1));
        this.currentCommandMatches = [];
      } else {
        this.mode = 'Normal';
        this.currentCommandMatches = [];
        this.currentArgumentMatches = [];
      }
    }
  }

  private adjustScroll(totalItems: number): void {
    if (this.selectedIndex < this.scrollOffset) {
      this.scrollOffset = this.selectedIndex;
    } else if (this.selectedIndex >= this.scrollOffset + this.maxVisibleItems) {
      this.scrollOffset = this.selectedIndex - this.maxVisibleItems + 1;
    }
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, totalItems - this.maxVisibleItems));
  }

  private buildResult(overrides?: Partial<InputStateResult>): InputStateResult {
    const shouldRender =
      (this.mode === 'SlashCommand' && this.currentCommandMatches.length > 0) ||
      (this.mode === 'SlashArgument' && this.currentArgumentMatches.length > 0);

    return {
      buffer: this.buffer,
      cursorPosition: this.cursorPosition,
      mode: this.mode,
      shouldRenderPalette: shouldRender,
      commandMatches: this.currentCommandMatches,
      argumentMatches: this.currentArgumentMatches,
      selectedIndex: this.selectedIndex,
      scrollOffset: this.scrollOffset,
      activeCommand: this.activeCommandDef,
      ...overrides,
    };
  }
}
