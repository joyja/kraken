"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = exports.generateEncodedTimeout = void 0;
const MessageRouter = __importStar(require("../message-router"));
const epath_1 = require("../epath");
const UNCONNECTED_SEND_SERVICE = 0x52;
const UNCONNECTED_SEND_PATH = Buffer.concat([
    epath_1.segments.LOGICAL.build(epath_1.segments.LOGICAL.types.ClassID, 0x06),
    epath_1.segments.LOGICAL.build(epath_1.segments.LOGICAL.types.InstanceID, 1)
]);
/**
 * Gets the Best Available Timeout Values
 *
 * @param timeout - Desired Timeout in ms
 * @returns Timeout Values
 */
const generateEncodedTimeout = (timeout) => {
    if (timeout <= 0 || typeof timeout !== "number")
        throw new Error("Timeouts Must be Positive Integers");
    let diff = Infinity; // let difference be very large
    let time_tick = 0;
    let ticks = 0;
    // Search for Best Timeout Encoding Values
    for (let i = 0; i < 16; i++) {
        for (let j = 1; j < 256; j++) {
            const newDiff = Math.abs(timeout - Math.pow(2, i) * j);
            if (newDiff <= diff) {
                diff = newDiff;
                time_tick = i;
                ticks = j;
            }
        }
    }
    return { time_tick, ticks };
};
exports.generateEncodedTimeout = generateEncodedTimeout;
/**
 * Builds an Unconnected Send Packet Buffer
 *
 * @param message_request - Message Request Encoded Buffer
 * @param path - Padded EPATH Buffer
 * @param timeout - timeout
 * @returns packet
 */
const build = (message_request, path, timeout = 2000) => {
    if (!Buffer.isBuffer(message_request))
        throw new Error("Message Request Must be of Type Buffer");
    if (!Buffer.isBuffer(path))
        throw new Error("Path Must be of Type Buffer");
    if (typeof timeout !== "number" || timeout < 100)
        timeout = 1000;
    // Get Encoded Timeout
    const encTimeout = generateEncodedTimeout(timeout);
    // Instantiate Buffer
    let buf = Buffer.alloc(2);
    // Write Encoded Timeout to Output Buffer
    buf.writeUInt8(encTimeout.time_tick, 0);
    buf.writeUInt8(encTimeout.ticks, 1);
    // Build Message Request Buffer
    const msgReqLen = message_request.length;
    const msgReqLenBuf = Buffer.alloc(2);
    msgReqLenBuf.writeUInt16LE(msgReqLen, 0);
    // Build Path Buffer
    const pathLen = Math.ceil(path.length / 2);
    const pathLenBuf = Buffer.alloc(1);
    pathLenBuf.writeUInt8(pathLen, 0);
    // Build Null Buffer
    const nullBuf = Buffer.alloc(1);
    // Assemble Unconnected Send Buffer
    if (msgReqLen % 2 === 1) {
        // requires Pad Byte after Message Request
        buf = Buffer.concat([
            buf,
            msgReqLenBuf,
            message_request,
            nullBuf,
            pathLenBuf,
            nullBuf,
            path
        ]);
    }
    else {
        buf = Buffer.concat([buf, msgReqLenBuf, message_request, pathLenBuf, nullBuf, path]);
    }
    return MessageRouter.build(UNCONNECTED_SEND_SERVICE, UNCONNECTED_SEND_PATH, buf);
};
exports.build = build;
