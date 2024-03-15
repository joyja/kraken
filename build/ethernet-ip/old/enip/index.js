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
exports.encapsulation = exports.CIP = exports.ENIP = void 0;
const net_1 = require("net");
const config_1 = require("../config");
const encapsulation = __importStar(require("./encapsulation"));
exports.encapsulation = encapsulation;
const CIP = __importStar(require("./cip"));
exports.CIP = CIP;
const utilities_1 = require("../utilities");
const dns_1 = require("dns");
class ENIP {
    state;
    socket;
    constructor() {
        this.socket = new net_1.Socket();
        this.state = {
            TCP: { establishing: false, established: false },
            session: { id: null, establishing: false, established: false },
            connection: {
                id: null,
                establishing: false,
                established: false,
                seq_num: 0,
            },
            error: { code: null, msg: null },
        };
        this._initializeEventHandlers();
    }
    get error() {
        return this.state.error;
    }
    get establishing() {
        return this.state.session.establishing;
    }
    get established() {
        return this.state.session.established;
    }
    get session_id() {
        return this.state.session.id;
    }
    async connect(IP_ADDR) {
        if (IP_ADDR.length === 0) {
            throw new Error('Controller <class> requires IP_ADDR <string>!!!');
        }
        await new Promise((resolve, reject) => {
            (0, dns_1.lookup)(IP_ADDR, (err, addr) => {
                if (err != null)
                    reject(new Error('DNS Lookup failed for IP_ADDR ' + IP_ADDR));
                if (!(0, net_1.isIPv4)(addr)) {
                    reject(new Error('Invalid IP_ADDR <string> passed to Controller <class>'));
                }
                resolve();
            });
        });
        const { registerSession } = encapsulation;
        this.state.session.establishing = true;
        this.state.TCP.establishing = true;
        const connectErr = new Error('TIMEOUT occurred while attempting to establish TCP connection with Controller.');
        // Connect to Controller and Then Send Register Session Packet
        await (0, utilities_1.promiseTimeout)(new Promise((resolve) => {
            this.socket.connect(config_1.EIP_PORT, IP_ADDR, () => {
                this.state.TCP.establishing = false;
                this.state.TCP.established = true;
                this.write(registerSession());
                resolve();
            });
        }), 10000, connectErr);
        const sessionErr = new Error('TIMEOUT occurred while attempting to establish Ethernet/IP session with Controller.');
        // Wait for Session to be Registered
        const sessid = await (0, utilities_1.promiseTimeout)(new Promise((resolve) => {
            this.socket.on('Session Registered', (sessid) => {
                resolve(sessid);
            });
            this.socket.on('Session Registration Failed', (error) => {
                this.state.error.code = error;
                this.state.error.msg = 'Failed to Register Session';
                resolve(null);
            });
        }), 10000, sessionErr);
        // Clean Up Local Listeners
        this.socket.removeAllListeners('Session Registered');
        this.socket.removeAllListeners('Session Registration Failed');
        // Return Session ID
        return sessid;
    }
    write(data, connected = false, timeout = 10, cb = null) {
        const { sendRRData, sendUnitData } = encapsulation;
        const { session, connection } = this.state;
        if (session.established && session.id !== null && connection.id !== null) {
            const packet = connected
                ? sendUnitData(session.id, data, connection.id, connection.seq_num)
                : sendRRData(session.id, data, timeout);
            if (cb != null) {
                this.socket.write(packet, cb);
            }
            else {
                this.socket.write(packet);
            }
        }
    }
    destroy(exception) {
        if (this.state.session.id !== null) {
            const { unregisterSession } = encapsulation;
            this.socket.write(unregisterSession(this.state.session.id), () => {
                this.state.session.established = false;
                this.socket.destroy(exception);
            });
        }
    }
    _initializeEventHandlers() {
        this.socket.on('data', this._handleDataEvent);
        this.socket.on('close', this._handleCloseEvent);
    }
    _handleDataEvent(data) {
        const { header, CPF, commands } = encapsulation;
        const encapsulatedData = header.parse(data);
        const { statusCode, status, commandCode } = encapsulatedData;
        if (statusCode !== 0) {
            console.log(`Error <${statusCode}>:`, status);
            this.state.error.code = statusCode;
            this.state.error.msg = status;
            this.socket.emit('Session Registration Failed', this.state.error);
        }
        else {
            this.state.error.code = null;
            this.state.error.msg = null;
            /* eslint-disable indent */
            switch (commandCode) {
                case commands.RegisterSession:
                    this.state.session.establishing = false;
                    this.state.session.established = true;
                    this.state.session.id = encapsulatedData.session;
                    this.socket.emit('Session Registered', this.state.session.id);
                    break;
                case commands.UnregisterSession:
                    this.state.session.established = false;
                    this.socket.emit('Session Unregistered');
                    break;
                case commands.SendRRData: {
                    const buf1 = Buffer.alloc(encapsulatedData.length - 6); // length of Data - Interface Handle <UDINT> and Timeout <UINT>
                    encapsulatedData.data?.copy(buf1, 0, 6);
                    const srrd = CPF.parse(buf1);
                    this.socket.emit('SendRRData Received', srrd);
                    break;
                }
                case commands.SendUnitData: {
                    const buf2 = Buffer.alloc(encapsulatedData.length - 6); // length of Data - Interface Handle <UDINT> and Timeout <UINT>
                    encapsulatedData.data?.copy(buf2, 0, 6);
                    const sud = CPF.parse(buf2);
                    this.socket.emit('SendUnitData Received', sud);
                    break;
                }
                default:
                    this.socket.emit('Unhandled Encapsulated Command Received', encapsulatedData);
            }
            /* eslint-enable indent */
        }
    }
    _handleCloseEvent(hadError) {
        this.state.session.established = false;
        this.state.TCP.established = false;
        if (hadError)
            throw new Error('Socket Transmission Failure Occurred!');
    }
}
exports.ENIP = ENIP;
