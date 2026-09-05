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
export declare class InputStateMachine {
    private mode;
    private buffer;
    private cursorPosition;
    private selectedIndex;
    private scrollOffset;
    private maxVisibleItems;
    private registry;
    private executionContext;
    private currentCommandMatches;
    private currentArgumentMatches;
    private activeCommandDef?;
    private activeArgIndex;
    private history;
    private historyIndex;
    private savedDraft;
    constructor(context: CommandExecutionContext);
    getMode(): InputMode;
    getBuffer(): string;
    getCursorPosition(): number;
    getSelectedIndex(): number;
    getScrollOffset(): number;
    getCommandMatches(): CommandMatchResult[];
    getArgumentMatches(): ArgumentMatchResult[];
    getActiveCommand(): CommandDefinition | undefined;
    setBuffer(buf: string): void;
    reset(): void;
    addToHistory(cmd: string): void;
    /**
     * Handle incoming raw keystroke from TTY interface.
     */
    handleKeypress(char: string | undefined, key: KeypressPayload | undefined): Promise<InputStateResult>;
    private recomputeState;
    private adjustScroll;
    private buildResult;
}
//# sourceMappingURL=input-state-machine.d.ts.map