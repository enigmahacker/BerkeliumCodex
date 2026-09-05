export function hexToRgb(hex) {
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
export function fgHex(hex, text) {
    if (!process.stdout.isTTY)
        return text;
    const [r, g, b] = hexToRgb(hex);
    return `\x1b[38;2;${r};${g};${b}m${text}\x1b[39m`;
}
export function bgHex(hex, text) {
    if (!process.stdout.isTTY)
        return text;
    const [r, g, b] = hexToRgb(hex);
    return `\x1b[48;2;${r};${g};${b}m${text}\x1b[49m`;
}
export function bold(text) {
    if (!process.stdout.isTTY)
        return text;
    return `\x1b[1m${text}\x1b[22m`;
}
export function dim(text) {
    if (!process.stdout.isTTY)
        return text;
    return `\x1b[2m${text}\x1b[22m`;
}
export function italic(text) {
    if (!process.stdout.isTTY)
        return text;
    return `\x1b[3m${text}\x1b[23m`;
}
export function underline(text) {
    if (!process.stdout.isTTY)
        return text;
    return `\x1b[4m${text}\x1b[24m`;
}
export function reset(text) {
    return `\x1b[0m${text}`;
}
export function stripAnsi(str) {
    return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}
//# sourceMappingURL=ansi.js.map