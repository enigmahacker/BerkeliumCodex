import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface FilePickerOptions {
  prompt?: string;
  defaultPath?: string;
  allowedExtensions?: string[];
}

/**
 * Trigger macOS Finder native file picker modal dialog via AppleScript.
 * Returns the absolute POSIX path of selected file, or null if cancelled / unsupported.
 */
export async function pickFileWithFinder(options?: FilePickerOptions): Promise<string | null> {
  if (process.platform !== 'darwin') {
    return null;
  }

  const promptText = options?.prompt || 'Select System Prompt File';
  const escapedPrompt = promptText.replace(/"/g, '\\"');
  const script = `POSIX path of (choose file with prompt "${escapedPrompt}")`;

  try {
    const { stdout } = await execFileAsync('osascript', ['-e', script], { timeout: 60000 });
    const selected = stdout.trim();
    return selected || null;
  } catch {
    // Returns null if user cancelled or dialog closed
    return null;
  }
}
