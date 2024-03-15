"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.System = void 0;
const systeminformation_1 = __importDefault(require("systeminformation"));
const mqtt_1 = require("../mqtt");
class System extends mqtt_1.MQTTData {
    constructor() {
        const metrics = [{
                name: 'systemInformation/os/platform',
                getter: async () => systeminformation_1.default.osInfo().then((data) => data.platform),
                type: 'String'
            }, {
                name: 'systemInformation/os/distro',
                getter: async () => systeminformation_1.default.osInfo().then((data) => data.distro),
                type: 'String'
            }, {
                name: 'systemInformation/os/release',
                getter: async () => systeminformation_1.default.osInfo().then((data) => data.release),
                type: 'String'
            }, {
                name: 'systemInformation/os/arch',
                getter: async () => systeminformation_1.default.osInfo().then((data) => data.arch),
                type: 'String'
            }, {
                name: 'systemInformation/os/hostname',
                getter: async () => systeminformation_1.default.osInfo().then((data) => data.hostname),
                type: 'String'
            }, {
                name: 'systemInformation/os/fqdn',
                getter: async () => systeminformation_1.default.osInfo().then((data) => data.fqdn),
                type: 'String'
            }, {
                name: 'systemInformation/cpu/processors',
                getter: async () => systeminformation_1.default.cpu().then((data) => data.processors),
                type: 'Float'
            }, {
                name: 'systemInformation/cpu/physicalCores',
                getter: async () => systeminformation_1.default.cpu().then((data) => data.physicalCores),
                type: 'Float'
            }, {
                name: 'systemInformation/cpu/cores',
                getter: async () => systeminformation_1.default.cpu().then((data) => data.cores),
                type: 'Float'
            }, {
                name: 'systemInformation/avgLoad',
                getter: async () => systeminformation_1.default.currentLoad().then((data) => data.avgLoad),
                type: 'Float'
            }, {
                name: 'systemInformation/mem/used',
                getter: async () => systeminformation_1.default.mem().then((data) => data.used),
                type: 'Float'
            }, {
                name: 'systemInformation/mem/used/gigabytes',
                getter: async () => systeminformation_1.default.mem().then((data) => data.used / (1024 * 1024 * 1024)),
                type: 'Float'
            }, {
                name: 'systemInformation/mem/total',
                getter: async () => systeminformation_1.default.mem().then((data) => data.total),
                type: 'Float'
            }, {
                name: 'systemInformation/mem/total/gigabytes',
                getter: async () => systeminformation_1.default.mem().then((data) => data.total / (1024 * 1024 * 1024)),
                type: 'Float'
            }, {
                name: 'systemInformation/temp',
                getter: async () => systeminformation_1.default.cpuTemperature().then((data) => data.main),
                type: 'Float'
            }, {
                name: 'systemInformation/disk/size',
                getter: async () => systeminformation_1.default.fsSize().then((data) => data[0].size),
                type: 'Float'
            }, {
                name: 'systemInformation/disk/size/gigabytes',
                getter: async () => systeminformation_1.default.fsSize().then((data) => data[0].size / (1024 * 1024 * 1024)),
                type: 'Float'
            }, {
                name: 'systemInformation/disk/used',
                getter: async () => systeminformation_1.default.fsSize().then((data) => data[0].used),
                type: 'Float'
            }, {
                name: 'systemInformation/disk/used/gigabytes',
                getter: async () => systeminformation_1.default.fsSize().then((data) => data[0].used / (1024 * 1024 * 1024)),
                type: 'Float'
            }];
        super(metrics);
    }
}
exports.System = System;
