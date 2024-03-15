"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringToObj = exports.objToString = exports.bufferToString = exports.stringToBuffer = exports.delay = exports.promiseTimeout = void 0;
/**
 * Wraps a Promise with a Timeout
 *
 * @param promise - Promise to add timeout to
 * @param ms - Timeout Length (ms)
 * @param error - Error to Emit if Timeout Occurs
 * @returns promise that rejects if not completed by timeout length
 */
const promiseTimeout = (promise, ms, error = new Error("ASYNC Function Call Timed Out!!!")) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => reject(error), ms);
        promise.then(resolve).catch(reject);
    });
};
exports.promiseTimeout = promiseTimeout;
/**
 * Delays X ms
 *
 * @param ms - Delay Length (ms)
 * @returns Promise resolved after delay length
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
exports.delay = delay;
/**
 * Helper Funcs to process strings
 *
 * @param buff - Buffer with encoded string length
 * @returns String
 */
const bufferToString = (buff) => {
    let newBuff = Buffer.from(buff);
    const len = newBuff.readUInt32LE();
    return newBuff.subarray(4, len + 4).toString();
};
exports.bufferToString = bufferToString;
/**
 * Helper Funcs to process strings
 *
 * @param str - Text string
 * @param len - Buffer Length to be encode string on to
 * @returns Buffer
 */
const stringToBuffer = (str, len = 88) => {
    const buf = Buffer.alloc(len);
    str = str.slice(0, len - 6);
    buf.writeUInt32LE(str.length);
    Buffer.from(str).copy(buf, 4);
    return buf;
};
exports.stringToBuffer = stringToBuffer;
/**
 * Convert string stucture object to string
 *
 * @param obj - string structure object
 * @returns
 */
const objToString = (obj) => {
    return String.fromCharCode(...obj.DATA.subarray(0, obj.LEN));
};
exports.objToString = objToString;
/**
 * Convert string to string structure object
 *
 * @param str - String to encode
 * @param len - Buffer length
 * @returns
 */
const stringToObj = (str, len = 82) => {
    const array = Array(len).fill(0);
    [...str].forEach((c, k) => {
        array[k] = c.charCodeAt();
    });
    return {
        LEN: str.length,
        DATA: array
    };
};
exports.stringToObj = stringToObj;
