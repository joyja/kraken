"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = void 0;
const PORT_SEGMENT = 0 << 5;
/**
 * Builds Port Segment for EPATH
 *
 * @param port - Port to leave Current Node (1 if Backplane)
 * @param link - Link address to route packet
 * @returns EPATH Port Segment
 */
const build = (port, link) => {
    if (typeof port !== 'number' || port <= 0)
        throw new Error('Port Number must be a Positive Integer');
    if (!(typeof link === 'string' || typeof link === 'number') ||
        Number(link) < 0)
        throw new Error('Link Number must be a Positive Integer or String');
    let buf = Buffer.alloc(0);
    let portIdentifierByte = PORT_SEGMENT; // Set High Byte of Segment (0x00)
    // Check Link Buffer Length
    let linkBuf;
    /* eslint-disable indent */
    switch (typeof link) {
        case 'string':
            linkBuf = Buffer.from(link);
            break;
        case 'number':
            linkBuf = Buffer.from([link]);
            break;
        default:
            throw new Error('Invalid link type');
    }
    /* eslint-enable indent */
    // Build Port Buffer
    if (port < 15) {
        portIdentifierByte |= port;
        if (linkBuf.length > 1) {
            portIdentifierByte |= 0x10; // Set Flag to Identify a link of greater than 1 Byte
            buf = Buffer.alloc(2);
            buf.writeInt8(linkBuf.length, 1);
        }
        else {
            buf = Buffer.alloc(1);
        }
    }
    else {
        portIdentifierByte |= 0x0f;
        if (linkBuf.length > 1) {
            portIdentifierByte |= 0x10; // Set Flag to Identify a link of greater than 1 Byte
            buf = Buffer.alloc(4);
            buf.writeUInt8(linkBuf.length, 1);
            buf.writeUInt16LE(port, 2);
        }
        else {
            buf = Buffer.alloc(3);
            buf.writeUInt16LE(port, 1);
        }
    }
    buf.writeUInt8(portIdentifierByte, 0);
    // Add Link to Buffer
    buf = Buffer.concat([buf, linkBuf]); // Buffer.from(linkBuf));Buffer.alloc(1))
    return buf.length % 2 === 1 ? Buffer.concat([buf, Buffer.alloc(1)]) : buf;
};
exports.build = build;
