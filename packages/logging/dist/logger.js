const LOG_LEVEL_SEVERITY = {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60,
};
export class Logger {
    level;
    subsystem;
    destinations;
    constructor(options = {}) {
        this.level = options.level || (process.env.BERKELIUM_DEBUG ? 'debug' : 'info');
        this.subsystem = options.subsystem || 'berkelium';
        this.destinations = options.destinations || [];
    }
    child(subsystem) {
        return new Logger({
            level: this.level,
            subsystem: `${this.subsystem}:${subsystem}`,
            destinations: this.destinations,
        });
    }
    setLevel(level) {
        this.level = level;
    }
    addDestination(dest) {
        this.destinations.push(dest);
    }
    shouldLog(level) {
        return LOG_LEVEL_SEVERITY[level] >= LOG_LEVEL_SEVERITY[this.level];
    }
    log(level, message, context, error) {
        if (!this.shouldLog(level))
            return;
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            subsystem: this.subsystem,
            message,
            context,
            error: error
                ? {
                    message: error.message,
                    stack: error.stack,
                    code: error.code,
                }
                : undefined,
        };
        for (const dest of this.destinations) {
            try {
                dest(entry);
            }
            catch {
                // Suppress destination failures to avoid recursive logging crashes
            }
        }
    }
    trace(message, context) {
        this.log('trace', message, context);
    }
    debug(message, context) {
        this.log('debug', message, context);
    }
    info(message, context) {
        this.log('info', message, context);
    }
    warn(message, context, error) {
        this.log('warn', message, context, error);
    }
    error(message, error, context) {
        this.log('error', message, context, error);
    }
    fatal(message, error, context) {
        this.log('fatal', message, context, error);
    }
}
export const defaultLogger = new Logger();
//# sourceMappingURL=logger.js.map