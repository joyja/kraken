/**
 * Wraps a Promise with a Timeout
 *
 * @param {Promise<T>} promise - promise to complete before the timeout
 * @param {number} ms - Timeout Length (ms)
 * @param {Error|string} error - Error to Emit if Timeout Occurs
 * @returns {Promise<T>}
 */
export const promiseTimeout = async <T>(
  promise: Promise<T>,
  ms: number,
  error: Error | string = new Error('ASYNC Function Call Timed Out!!!'),
): Promise<T> => {
  return await new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      reject(error)
    }, ms)
    promise.then(resolve).catch(reject)
  })
}

/**
 * Delays X ms
 *
 * @param {number} ms - Delay Length (ms)
 * @returns {Promise<void>}
 */
export const delay = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms))
}
