import { LogEntry, LogLevel, LoggerOptions } from './types.js';

const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

export class Logger {
  private level: LogLevel;
  private subsystem: string;
  private destinations: Array<(entry: LogEntry) => void>;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || (process.env.BERKELIUM_DEBUG ? 'debug' : 'info');
    this.subsystem = options.subsystem || 'berkelium';
    this.destinations = options.destinations || [];
  }

  public child(subsystem: string): Logger {
    return new Logger({
      level: this.level,
      subsystem: `${this.subsystem}:${subsystem}`,
      destinations: this.destinations,
    });
  }

  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  public addDestination(dest: (entry: LogEntry) => void): void {
    this.destinations.push(dest);
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_SEVERITY[level] >= LOG_LEVEL_SEVERITY[this.level];
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      subsystem: this.subsystem,
      message,
      context,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            code: (error as any).code,
          }
        : undefined,
    };

    for (const dest of this.destinations) {
      try {
        dest(entry);
      } catch {
        // Suppress destination failures to avoid recursive logging crashes
      }
    }
  }

  public trace(message: string, context?: Record<string, unknown>): void {
    this.log('trace', message, context);
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  public info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  public warn(message: string, context?: Record<string, unknown>, error?: Error): void {
    this.log('warn', message, context, error);
  }

  public error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, context, error);
  }

  public fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('fatal', message, context, error);
  }
}

export const defaultLogger = new Logger();
