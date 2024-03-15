"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.build = exports.services = void 0;
exports.services = {
    GET_ATTRIBUTE_ALL: 0x01,
    GET_ATTRIBUTE_SINGLE: 0x0e,
    RESET: 0x05,
    START: 0x06,
    STOP: 0x07,
    CREATE: 0x08,
    DELETE: 0x09,
    MULTIPLE_SERVICE_PACKET: 0x0a,
    APPLY_ATTRIBUTES: 0x0d,
    SET_ATTRIBUTE_SINGLE: 0x10,
    FIND_NEXT: 0x11,
    READ_TAG: 0x4c,
    WRITE_TAG: 0x4d,
    READ_TAG_FRAGMENTED: 0x52,
    WRITE_TAG_FRAGMENTED: 0x53,
    READ_MODIFY_WRITE_TAG: 0x4e,
};
/**
 * Builds a Message Router Request Buffer
 *
 * @param {number} service - CIP Service Code
 * @param {Buffer} path - CIP Padded EPATH (Vol 1 - Appendix C)
 * @param {Buffer} data - Service Specific Data to be Sent
 * @returns {Buffer} Message Router Request Buffer
 */
const build = (service, path, data) => {
    const pathBuf = Buffer.from(path);
    const dataBuf = Buffer.from(data);
    const pathLen = Math.ceil(pathBuf.length / 2);
    const buf = Buffer.alloc(2 + pathLen * 2 + dataBuf.length);
    buf.writeUInt8(service, 0);
    buf.writeUInt8(pathLen, 1);
    pathBuf.copy(buf, 2);
    dataBuf.copy(buf, 2 + pathLen * 2);
    return buf;
};
exports.build = build;
/**
 * Parses a Message Router Request Buffer
 *
 * @param {Buffer} buf - Message Router Request Buffer
 * @returns {MessageRouter} Decoded Message Router Object
 */
const parse = (buf) => {
    const MessageRouter = {
        service: buf.readUInt8(0),
        generalStatusCode: buf.readUInt8(2),
        extendedStatusLength: buf.readUInt8(3),
        extendedStatus: [],
        data: Buffer.alloc(0),
    };
    for (let i = 0; i < MessageRouter.extendedStatusLength; i++) {
        MessageRouter.extendedStatus.push(buf.readUInt16LE(i * 2 + 4));
    }
    const dataStart = MessageRouter.extendedStatusLength * 2 + 4;
    const data = Buffer.alloc(buf.length - dataStart);
    buf.copy(data, 0, dataStart);
    MessageRouter.data = data;
    return MessageRouter;
};
exports.parse = parse;
