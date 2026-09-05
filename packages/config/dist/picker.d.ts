export interface FilePickerOptions {
    prompt?: string;
    defaultPath?: string;
    allowedExtensions?: string[];
}
/**
 * Trigger macOS Finder native file picker modal dialog via AppleScript.
 * Returns the absolute POSIX path of selected file, or null if cancelled / unsupported.
 */
export declare function pickFileWithFinder(options?: FilePickerOptions): Promise<string | null>;
//# sourceMappingURL=picker.d.ts.map