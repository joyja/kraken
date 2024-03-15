"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class OutputMap {
    mapping;
    /**
     * Helper to encode input buffer from process value
     */
    constructor() {
        this.mapping = [];
    }
    /**
     * Add a bit value to encode
     *
     * @param byte - Which byte to start at
     * @param offset - Number of bits to offset
     * @param name - Unique name to reference value
     * @param value - Initial value
     */
    addBit(byte, offset, name, value = false) {
        this.mapping.push({
            size: 1,
            byte: byte,
            offset: offset,
            name: name,
            value: value
        });
    }
    /**
     * Add a 16 bit integer value to encode
     *
     * @param byte - Number off bytes to offset
     * @param name - Unique name to reference value
     * @param value - Initial value
     */
    addInt(byte, name, value = 0) {
        this.mapping.push({
            size: 16,
            byte: byte,
            offset: null,
            name: name,
            value: value
        });
    }
    /**
     * Reads encodes each map process value and writes to buffer
     *
     * @param data - Device output buffer
     * @returns Device output buffer encoded with values
     */
    _writeMap(data) {
        this.mapping.forEach(map => {
            switch (map.size) {
                case 1:
                    (map.value) ? data[map.byte] |= (1 << map.offset) : data[map.byte] &= ~(1 << map.offset);
                    break;
                case 16:
                    data.writeUInt16LE(map.value, map.byte);
                    break;
            }
        });
        return data;
    }
    /**
     * Set a process value for a output buffer
     *
     * @param name - Name of map item
     * @param data - Device input buffer
     * @param value - New value to send to device
     * @returns Output buffer to send to device
     */
    setValue(name, value, data) {
        this.mapping[this.mapping.findIndex(map => map.name === name)].value = value;
        return this._writeMap(data);
    }
    /**
     * Get array of names assigned to mappings
     *
     * @returns Array of names
     */
    getNames() {
        return this.mapping.map(item => item.name);
    }
}
exports.default = OutputMap;
