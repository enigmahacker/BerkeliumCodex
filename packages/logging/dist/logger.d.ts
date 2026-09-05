import { LogEntry, LogLevel, LoggerOptions } from './types.js';
export declare class Logger {
    private level;
    private subsystem;
    private destinations;
    constructor(options?: LoggerOptions);
    child(subsystem: string): Logger;
    setLevel(level: LogLevel): void;
    addDestination(dest: (entry: LogEntry) => void): void;
    private shouldLog;
    private log;
    trace(message: string, context?: Record<string, unknown>): void;
    debug(message: string, context?: Record<string, unknown>): void;
    info(message: string, context?: Record<string, unknown>): void;
    warn(message: string, context?: Record<string, unknown>, error?: Error): void;
    error(message: string, error?: Error, context?: Record<string, unknown>): void;
    fatal(message: string, error?: Error, context?: Record<string, unknown>): void;
}
export declare const defaultLogger: Logger;
//# sourceMappingURL=logger.d.ts.map