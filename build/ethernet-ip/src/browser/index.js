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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Browser = void 0;
const EthernetIP = __importStar(require("../enip"));
const dgram_1 = __importDefault(require("dgram"));
const events_1 = require("events");
const listIdentityRequest = EthernetIP.encapsulation.header.build(EthernetIP.encapsulation.commands.ListIdentity);
class Browser extends events_1.EventEmitter {
    constructor(originatorPort = 51687, originatorIPaddress = '0.0.0.0', autoBrowse = true, updateRate = 3000, disconnectMultiplier = 4) {
        super();
        this.socket = dgram_1.default.createSocket('udp4');
        this.originatorIPaddress = originatorIPaddress;
        this.autoBrowse = autoBrowse;
        this.updateRate = updateRate;
        this.disconnectMultiplier = disconnectMultiplier;
        this.deviceList = [];
        this.socket.bind(originatorPort, originatorIPaddress, () => {
            this.socket.setBroadcast(true);
            if (this.autoBrowse)
                this.start();
        });
        this._setupSocketEvents();
        this.updateInterval = null;
    }
    start() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.deviceList.forEach((dev, i) => {
            this.deviceList[i].timestamp = Date.now();
        });
        this.updateInterval = setInterval(() => {
            this.checkStatus();
            this.socket.send(listIdentityRequest, 44818, '255.255.255.255', (e) => {
                if (e)
                    throw e;
                this.emit('Broadcast Request');
            });
        }, this.updateRate);
    }
    stop() {
        clearInterval(this.updateInterval);
    }
    checkStatus() {
        let deviceDisconnected = false;
        this.deviceList.forEach((device) => {
            if (Date.now() - device.timestamp >
                this.updateRate * this.disconnectMultiplier) {
                this.emit('Device Disconnected', device);
                deviceDisconnected = true;
            }
        });
        this.deviceList = this.deviceList.filter((device) => Date.now() - device.timestamp <=
            this.updateRate * this.disconnectMultiplier);
        if (deviceDisconnected)
            this.emit('Device List Updated', this.deviceList);
    }
    _setupSocketEvents() {
        this.socket.on('message', (msg) => {
            const device = this._parseListIdentityResponse(msg);
            if (Object.keys(device).length !== 0)
                this._addDevice(device); // Device is added only if device is not empty object
        });
    }
    _parseListIdentityResponse(msg) {
        const response = {
            EncapsulationVersion: undefined,
            socketAddress: {
                sin_family: undefined,
                sin_port: undefined,
                sin_addr: undefined,
                sin_zero: undefined,
            },
            vendorID: undefined,
            deviceType: undefined,
            productCode: undefined,
            revision: undefined,
            status: undefined,
            serialNumber: undefined,
            productName: undefined,
            state: undefined,
            timestamp: undefined,
        };
        const messageData = EthernetIP.encapsulation.header.parse(msg);
        // Check if messageData is not undefined
        if (messageData !== undefined) {
            const cpf = EthernetIP.encapsulation.CPF.parse(messageData.data);
            // Check if cpf is not undefined
            if (cpf !== undefined) {
                // Check if cpf is an array
                if (Array.isArray(cpf)) {
                    // Check if cpf[0] is not undefined
                    if (cpf[0] !== undefined) {
                        const data = cpf[0].data;
                        let ptr = 0;
                        response.EncapsulationVersion = data.readUInt16LE(ptr);
                        ptr += 2;
                        response.socketAddress.sin_family = data.readUInt16BE(ptr);
                        ptr += 2;
                        response.socketAddress.sin_port = data.readUInt16BE(ptr);
                        ptr += 2;
                        response.socketAddress.sin_addr =
                            data.readUInt8(ptr).toString() +
                                '.' +
                                data.readUInt8(ptr + 1).toString() +
                                '.' +
                                data.readUInt8(ptr + 2).toString() +
                                '.' +
                                data.readUInt8(ptr + 3).toString();
                        ptr += 4;
                        response.socketAddress.sin_zero = data.slice(ptr, ptr + 8);
                        ptr += 8;
                        response.vendorID = data.readUInt16LE(ptr);
                        ptr += 2;
                        response.deviceType = data.readUInt16LE(ptr);
                        ptr += 2;
                        response.productCode = data.readUInt16LE(ptr);
                        ptr += 2;
                        response.revision =
                            data.readUInt8(ptr).toString() +
                                '.' +
                                data.readUInt8(ptr + 1).toString();
                        ptr += 2;
                        response.status = data.readUInt16LE(ptr);
                        ptr += 2;
                        response.serialNumber = '0x' + data.readUInt32LE(ptr).toString(16);
                        ptr += 4;
                        response.productName = data
                            .slice(ptr + 1, ptr + 1 + data.readUInt8(ptr))
                            .toString();
                        ptr += 1 + data.readUInt8(ptr);
                        response.state = data.readUInt8(ptr);
                    }
                }
            }
        }
        return response;
    }
    _addDevice(device) {
        const index = this.deviceList.findIndex((item) => item.socketAddress.sin_addr === device.socketAddress.sin_addr);
        device.timestamp = Date.now();
        if (index > -1) {
            this.deviceList[index] = device;
        }
        else {
            this.deviceList.push(device);
            this.emit('New Device', device);
            this.emit('Device List Updated', this.deviceList);
        }
    }
}
exports.Browser = Browser;
exports.default = Browser;
