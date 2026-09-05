export function hexToRgb(hex: string): [number, number, number] {
  let cleaned = hex.replace(/^#/, '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (cleaned.length !== 6) {
    return [255, 255, 255];
  }
  const num = parseInt(cleaned, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function fgHex(hex: string, text: string): string {
  if (!process.stdout.isTTY) return text;
  const [r, g, b] = hexToRgb(hex);
  return `\x1b[38;2;${r};${g};${b}m${text}\x1b[39m`;
}

export function bgHex(hex: string, text: string): string {
  if (!process.stdout.isTTY) return text;
  const [r, g, b] = hexToRgb(hex);
  return `\x1b[48;2;${r};${g};${b}m${text}\x1b[49m`;
}

export function bold(text: string): string {
  if (!process.stdout.isTTY) return text;
  return `\x1b[1m${text}\x1b[22m`;
}

export function dim(text: string): string {
  if (!process.stdout.isTTY) return text;
  return `\x1b[2m${text}\x1b[22m`;
}

export function italic(text: string): string {
  if (!process.stdout.isTTY) return text;
  return `\x1b[3m${text}\x1b[23m`;
}

export function underline(text: string): string {
  if (!process.stdout.isTTY) return text;
  return `\x1b[4m${text}\x1b[24m`;
}

export function reset(text: string): string {
  return `\x1b[0m${text}`;
}

export function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}
