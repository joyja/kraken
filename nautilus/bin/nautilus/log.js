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
var Log = /** @class */ (function () {
    function Log(context) {
        this.level = process.env.JOYCOMMERCE_LOGLEVEL ? process.env.JOYCOMMERCE_LOGLEVEL : process.env.NODE_ENV === 'development' ? LogLevel.info : LogLevel.warn;
        this.context = context;
    }
    Log.prototype.debug = function (message) {
        if (this.level === LogLevel.debug) {
            console.debug("".concat(this.context ? "".concat(this.context, ": ") : "").concat(message));
        }
    };
    Log.prototype.info = function (message) {
        if (this.level === LogLevel.info) {
            console.info("".concat(this.context ? "".concat(this.context, ": ") : "").concat(message));
        }
    };
    Log.prototype.warn = function (message) {
        if (this.level === LogLevel.warn) {
            console.warn("".concat(this.context ? "".concat(this.context, ": ") : "").concat(message));
        }
    };
    Log.prototype.error = function (message) {
        if (this.level === LogLevel.error) {
            console.error("".concat(this.context ? "".concat(this.context, ": ") : "").concat(message));
        }
    };
    Log.prototype.getErrorMessage = function (error) {
        return toErrorWithMessage(error).message;
    };
    return Log;
}());
exports.Log = Log;
//# sourceMappingURL=log.js.map