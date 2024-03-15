"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = exports.promiseTimeout = void 0;
/**
 * Wraps a Promise with a Timeout
 *
 * @param {Promise<T>} promise - promise to complete before the timeout
 * @param {number} ms - Timeout Length (ms)
 * @param {Error|string} error - Error to Emit if Timeout Occurs
 * @returns {Promise<T>}
 */
const promiseTimeout = async (promise, ms, error = new Error('ASYNC Function Call Timed Out!!!')) => {
    return await new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(error);
        }, ms);
        promise.then(resolve).catch(reject);
    });
};
exports.promiseTimeout = promiseTimeout;
/**
 * Delays X ms
 *
 * @param {number} ms - Delay Length (ms)
 * @returns {Promise<void>}
 */
const delay = async (ms) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
};
exports.delay = delay;
