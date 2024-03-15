import { build as MessageRouterBuild } from './messageRouter'
import { segments } from './epath'

const UNCONNECTED_SEND_SERVICE = 0x52
const UNCONNECTED_SEND_PATH = Buffer.concat([
  segments.LOGICAL.build(segments.LOGICAL.types.ClassID, 0x06),
  segments.LOGICAL.build(segments.LOGICAL.types.InstanceID, 1),
])

/**
 * @typedef UCMMSendTimeout
 * @type {Object}
 * @property {number} timeTicks
 * @property {number} ticks
 */
interface UCMMSendTimeout {
  timeTick: number
  ticks: number
}

/**
 * Gets the Best Available Timeout Values
 *
 * @param {number} timeout - Desired Timeout in ms
 * @returns {UCMMSendTimeout}
 */
const generateEncodedTimeout = (timeout: number): UCMMSendTimeout => {
  if (timeout <= 0 || typeof timeout !== 'number')
    throw new Error('Timeouts Must be Positive Integers')

  let diff = Infinity // let difference be very large
  let timeTick = 0
  let ticks = 0

  // Search for Best Timeout Encoding Values
  for (let i = 0; i < 16; i++) {
    for (let j = 1; j < 256; j++) {
      const newDiff = Math.abs(timeout - Math.pow(2, i) * j)
      if (newDiff <= diff) {
        diff = newDiff
        timeTick = i
        ticks = j
      }
    }
  }

  return { timeTick, ticks }
}

/**
 * Builds an Unconnected Send Packet Buffer
 *
 * @param {buffer} messageRequest - Message Request Encoded Buffer
 * @param {buffer} path - Padded EPATH Buffer
 * @param {number} [timeout=2000] - timeout
 * @returns {buffer}
 */
const build = (
  messageRequest: Buffer,
  path: Buffer,
  timeout: number = 2000,
): Buffer => {
  if (!Buffer.isBuffer(messageRequest))
    throw new Error('Message Request Must be of Type Buffer')
  if (!Buffer.isBuffer(path)) throw new Error('Path Must be of Type Buffer')
  if (typeof timeout !== 'number' || timeout < 100) timeout = 1000

  // Get Encoded Timeout
  const encTimeout = generateEncodedTimeout(timeout)

  // Instantiate Buffer
  let buf = Buffer.alloc(2)

  // Write Encoded Timeout to Output Buffer
  buf.writeUInt8(encTimeout.timeTick, 0)
  buf.writeUInt8(encTimeout.ticks, 1)

  // Build Message Request Buffer
  const msgReqLen = messageRequest.length
  const msgReqLenBuf = Buffer.alloc(2)
  msgReqLenBuf.writeUInt16LE(msgReqLen, 0)

  // Build Path Buffer
  const pathLen = Math.ceil(path.length / 2)
  const pathLenBuf = Buffer.alloc(1)
  pathLenBuf.writeUInt8(pathLen, 0)

  // Build Null Buffer
  const nullBuf = Buffer.alloc(1)

  // Assemble Unconnected Send Buffer
  if (msgReqLen % 2 === 1) {
    // requires Pad Byte after Message Request
    buf = Buffer.concat([
      buf,
      msgReqLenBuf,
      messageRequest,
      nullBuf,
      pathLenBuf,
      nullBuf,
      path,
    ])
  } else {
    buf = Buffer.concat([
      buf,
      msgReqLenBuf,
      messageRequest,
      pathLenBuf,
      nullBuf,
      path,
    ])
  }

  return MessageRouterBuild(
    UNCONNECTED_SEND_SERVICE,
    UNCONNECTED_SEND_PATH,
    buf,
  )
}

export { generateEncodedTimeout, build }
