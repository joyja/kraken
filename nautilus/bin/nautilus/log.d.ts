declare enum LogLevel {
    debug = "DEBUG",
    info = "INFO",
    warn = "WARN",
    error = "ERROR"
}
export declare class Log {
    level: LogLevel;
    context?: string;
    constructor(context?: string);
    debug(message: string): void;
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    getErrorMessage(error: unknown): string;
}
export {};
//# sourceMappingURL=log.d.ts.map