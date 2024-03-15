"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel["debug"] = "DEBUG";
    LogLevel["info"] = "INFO";
    LogLevel["warn"] = "WARN";
    LogLevel["error"] = "ERROR";
})(LogLevel || (LogLevel = {}));
function isErrorWithMessage(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof error.message === 'string');
}
function toErrorWithMessage(maybeError) {
    if (isErrorWithMessage(maybeError))
        return maybeError;
    try {
        return new Error(JSON.stringify(maybeError));
    }
    catch {
        // fallback in case there's an error stringifying the maybeError
        // like with circular references for example.
        return new Error(String(maybeError));
    }
}
class Log {
    level;
    context;
    constructor(context) {
        this.level = process.env.SQUID_LOGLEVEL ? process.env.SQUID_LOGLEVEL : process.env.NODE_ENV === 'development' ? LogLevel.warn : LogLevel.warn;
        this.context = context;
    }
    debug(message) {
        if (this.level === LogLevel.debug) {
            console.debug(`${this.context ? `${this.context}: ` : ``}${message}`);
        }
    }
    info(message) {
        if ([LogLevel.info, LogLevel.debug].includes(this.level)) {
            console.info(`${this.context ? `${this.context}: ` : ``}${message}`);
        }
    }
    warn(message) {
        if ([LogLevel.warn, LogLevel.info, LogLevel.debug].includes(this.level)) {
            console.warn(`${this.context ? `${this.context}: ` : ``}${message}`);
        }
    }
    error(message) {
        if ([LogLevel.error, LogLevel.warn, LogLevel.info, LogLevel.debug].includes(this.level)) {
            console.error(`${this.context ? `${this.context}: ` : ``}${message}`);
        }
    }
    getErrorMessage(error) {
        return toErrorWithMessage(error).message;
    }
}
exports.Log = Log;
