"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthernetIP = void 0;
const ethernet_ip_1 = require("ethernet-ip");
const log_1 = require("./log");
const log = new log_1.Log('Ethernet/IP');
class EthernetIP {
    host;
    port;
    plc;
    interval;
    connected = false;
    constructor({ host, port = 44818, interval = 1000 }) {
        this.host = host;
        this.port = port;
        this.interval = interval;
        this.plc = new ethernet_ip_1.Controller();
    }
    async connect() {
        try {
            await this.plc.connect(this.host, this.port);
            this.connected = true;
            log.info(`Connected to Ethernet/IP device at ${this.host}:${this.port}`);
        }
        catch (error) {
            log.error(`Failed to connect to Ethernet/IP device: ${error.message}`);
            this.connected = false;
        }
    }
    async disconnect() {
        try {
            await this.plc.disconnect();
            this.connected = false;
            log.info(`Disconnected from Ethernet/IP device at ${this.host}:${this.port}`);
        }
        catch (error) {
            log.error(`Failed to disconnect from Ethernet/IP device: ${error.message}`);
        }
    }
    async readTag(tagName) {
        if (!this.connected) {
            log.error("Not connected to the Ethernet/IP device.");
            return;
        }
        try {
            const tag = await this.plc.readTag(tagName);
            return tag.value;
        }
        catch (error) {
            log.error(`Failed to read tag ${tagName}: ${error.message}`);
        }
    }
    async writeTag(tagName, value, type) {
        if (!this.connected) {
            log.error("Not connected to the Ethernet/IP device.");
            return;
        }
        try {
            await this.plc.writeTag(tagName, value, type);
            log.info(`Written value ${value} to tag ${tagName}`);
        }
        catch (error) {
            log.error(`Failed to write to tag ${tagName}: ${error.message}`);
        }
    }
    addTags(...tags) {
        this.plc.subscribe(...tags);
        this.plc.scan(this.interval);
    }
    async getTagValue(tagName) {
        const tag = this.plc.using(tagName);
        if (tag !== null && tag !== undefined) {
            log.error(`Tag ${tagName} not found.`);
            return;
        }
        return tag.value;
    }
}
exports.EthernetIP = EthernetIP;
