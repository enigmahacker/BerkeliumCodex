import { ThemeManager, fgHex } from '@berkelium/themes';

export interface MatrixRainOptions {
  durationMs?: number;
  columns?: number;
  rows?: number;
  fps?: number;
  colorScheme?: 'cyan' | 'matrix-green' | 'cobalt';
}

interface ColumnStream {
  headRow: number;
  speed: number;
  length: number;
  chars: string[];
}

export class BkMatrix {
  private static readonly GLYPHS =
    '0123456789ABCDEFλπΩΨΣθβBk97✦◈◇⚡アイウエオカキクケコサシスセソタチツテト';

  /**
   * Renders the authentic Berkelium (Bk - 97 / 247) Codex Emblem
   * with electric cyan & cobalt gradient styling.
   *
   * Inspired by:
   *  - Element 97 (Berkelium)
   *  - Atomic Weight (247)
   *  - "PROUDLY INDIAN. BUILT FOR THE WORLD."
   */
  public static renderCodexEmblem(themeManager?: ThemeManager): void {
    const fmt = themeManager ? themeManager.getFormatted() : null;

    // Electric cyan to deep cobalt gradient palette
    const cyan = (t: string) => fgHex('#00d2ff', t);
    const neonBlue = (t: string) => fgHex('#0099ff', t);
    const royalBlue = (t: string) => fgHex('#3a7bd5', t);
    const deepBlue = (t: string) => fgHex('#1e40af', t);
    const white = (t: string) => fgHex('#ffffff', t);
    const gold = (t: string) => fgHex('#f59e0b', t);
    const dim = (t: string) => fgHex('#64748b', t);

    const bold = (s: string) => (fmt ? fmt.bold(s) : `\x1b[1m${s}\x1b[22m`);

    console.log();
    console.log(
      cyan('             ') +
        gold(bold('97')) +
        cyan('               ╭───●───╮              ') +
        royalBlue(bold('(247)'))
    );
    console.log(cyan('                            ╭─╯       ╰─╮'));
    console.log(
      '             ' +
        cyan(bold('██████╗ ')) +
        '     ' +
        neonBlue(bold('██╗  ██╗')) +
        '      ' +
        royalBlue('│')
    );
    console.log(
      '             ' +
        cyan(bold('██╔══██╗')) +
        '     ' +
        neonBlue(bold('██║ ██╔╝')) +
        '      ' +
        royalBlue('│')
    );
    console.log(
      '             ' +
        cyan(bold('██████╔╝')) +
        '     ' +
        neonBlue(bold('█████╔╝ ')) +
        '      ' +
        royalBlue('│')
    );
    console.log(
      '             ' +
        royalBlue(bold('██╔══██╗')) +
        '     ' +
        royalBlue(bold('██╔═██╗ ')) +
        '      ' +
        royalBlue('│')
    );
    console.log(
      '             ' +
        royalBlue(bold('██████╔╝')) +
        '  ' +
        cyan('●') +
        '  ' +
        deepBlue(bold('██║  ██╗')) +
        '     ' +
        royalBlue('╭─╯')
    );
    console.log(
      '             ' +
        deepBlue(bold('╚═════╝ ')) +
        '     ' +
        deepBlue(bold('╚═╝  ╚═╝')) +
        '   ' +
        cyan('╰───╯')
    );
    console.log();
    console.log(white(bold('              PROUDLY INDIAN. BUILT FOR THE WORLD.')));
    console.log(cyan('                          ─────────────'));
    console.log(dim('             BERKELIUM CODEX // NEURAL CODING RUNTIME'));
    console.log();
  }

  /**
   * Compact header banner for the interactive TUI.
   */
  public static renderCodexHeader(
    themeManager: ThemeManager,
    model: string,
    provider: string,
    workspace: string
  ): void {
    const fmt = themeManager.getFormatted();
    const cyan = (t: string) => fgHex('#00d2ff', t);
    const royal = (t: string) => fgHex('#3a7bd5', t);

    console.log();
    console.log(royal('╭─ ') + cyan(fmt.bold('Bk // BERKELIUM CODEX')) + royal(' ─────────────────────────────────────╮'));
    console.log(
      royal('│ ') +
        fmt.bold(fmt.primary('MODEL     ')) +
        fmt.assistant(`${model} (${provider})`).padEnd(48, ' ') +
        royal('│')
    );
    console.log(
      royal('│ ') +
        fmt.dimmed('WORKSPACE ') +
        fmt.muted(workspace.slice(-44)).padEnd(48, ' ') +
        royal('│')
    );
    console.log(
      royal('│ ') +
        fmt.dimmed('ORIGIN    ') +
        fgHex('#00d2ff', 'Element 97 • Proudly Indian. Built for the World.').padEnd(48, ' ') +
        royal('│')
    );
    console.log(royal('╰──────────────────────────────────────────────────────────╯'));
    console.log();
  }

  /**
   * Plays a high-fidelity Matrix / Codex digital stream sequence with
   * independent falling character streams, bright leading heads, glowing trails,
   * and a seamless dissolution into the Bk Codex Emblem.
   */
  public static async playMatrixRain(
    themeManager: ThemeManager,
    options: MatrixRainOptions = {}
  ): Promise<void> {
    const durationMs = options.durationMs ?? 1500;
    const termCols = process.stdout.columns || 80;
    const termRows = process.stdout.rows || 24;

    const numCols = Math.min(termCols, options.columns ?? 65);
    const numRows = Math.min(termRows - 2, options.rows ?? 14);
    const fps = options.fps ?? 24;
    const frameInterval = Math.floor(1000 / fps);
    const totalFrames = Math.max(10, Math.floor(durationMs / frameInterval));

    // Initialize random column streams
    const streams: ColumnStream[] = [];
    for (let c = 0; c < numCols; c++) {
      streams.push({
        headRow: Math.floor(Math.random() * numRows) - numRows,
        speed: 0.5 + Math.random() * 1.5,
        length: 4 + Math.floor(Math.random() * 8),
        chars: Array.from({ length: numRows }, () => this.randomGlyph()),
      });
    }

    // Hide cursor during animation
    process.stdout.write('\x1b[?25l');
    console.clear();

    try {
      for (let f = 0; f < totalFrames; f++) {
        const grid: string[][] = Array.from({ length: numRows }, () =>
          Array.from({ length: numCols }, () => ' ')
        );

        // Update streams
        for (let c = 0; c < numCols; c++) {
          const stream = streams[c];
          stream.headRow += stream.speed;

          // If stream fell off the bottom, reset with new length and speed
          if (stream.headRow - stream.length > numRows) {
            stream.headRow = -Math.floor(Math.random() * 5);
            stream.speed = 0.5 + Math.random() * 1.5;
            stream.length = 4 + Math.floor(Math.random() * 8);
          }

          // Random character mutation for active streams
          if (Math.random() > 0.3) {
            const mutIndex = Math.floor(Math.random() * numRows);
            stream.chars[mutIndex] = this.randomGlyph();
          }

          // Render column stream onto grid
          const headInt = Math.floor(stream.headRow);
          for (let r = 0; r < numRows; r++) {
            const distFromHead = headInt - r;
            if (distFromHead >= 0 && distFromHead < stream.length) {
              const char = stream.chars[r] || ' ';
              if (distFromHead === 0) {
                // Bright white/electric cyan head
                grid[r][c] = fgHex('#ffffff', `\x1b[1m${char}\x1b[22m`);
              } else if (distFromHead === 1) {
                // Neon cyan
                grid[r][c] = fgHex('#00d2ff', `\x1b[1m${char}\x1b[22m`);
              } else if (distFromHead < 4) {
                // Vibrant blue
                grid[r][c] = fgHex('#0099ff', char);
              } else if (distFromHead < 7) {
                // Royal blue
                grid[r][c] = fgHex('#3a7bd5', char);
              } else {
                // Fading cobalt tail
                grid[r][c] = fgHex('#1e40af', char);
              }
            }
          }
        }

        // Render buffer
        let frameBuffer = '';
        for (let r = 0; r < numRows; r++) {
          frameBuffer += grid[r].join('') + '\n';
        }

        if (f > 0) {
          process.stdout.write(`\x1b[${numRows}A`);
        }
        process.stdout.write(frameBuffer);

        await new Promise((resolve) => setTimeout(resolve, frameInterval));
      }
    } finally {
      // Restore cursor
      process.stdout.write('\x1b[?25h');
    }

    console.clear();
    this.renderCodexEmblem(themeManager);
  }

  private static randomGlyph(): string {
    return this.GLYPHS[Math.floor(Math.random() * this.GLYPHS.length)];
  }
}
