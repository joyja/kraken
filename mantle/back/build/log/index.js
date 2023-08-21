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
    catch (_a) {
        // fallback in case there's an error stringifying the maybeError
        // like with circular references for example.
        return new Error(String(maybeError));
    }
}
function getErrorMessage(error) {
    return toErrorWithMessage(error).message;
}
class Log {
    constructor(context) {
        this.level = process.env.MANTLE_LOGLEVEL ? process.env.MANTLE_LOGLEVEL : process.env.NODE_ENV === 'development' ? LogLevel.info : LogLevel.warn;
        this.context = context;
    }
    debug(message) {
        if (this.level === LogLevel.debug) {
            console.debug(`${this.context}: ${message}`);
        }
    }
    info(message) {
        if (this.level === LogLevel.info) {
            console.info(`${this.context}: ${message}`);
        }
    }
    warn(message) {
        if (this.level === LogLevel.warn) {
            console.warn(`${this.context}: ${message}`);
        }
    }
    error(message) {
        if (this.level === LogLevel.error) {
            console.error(`${this.context}: ${message}`);
        }
    }
    getErrorMessage(error) {
        return toErrorWithMessage(error).message;
    }
}
exports.Log = Log;
