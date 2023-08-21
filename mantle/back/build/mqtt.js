"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.spdata = exports.SparkplugMetric = void 0;
const kraken_sparkplug_client_1 = require("kraken-sparkplug-client");
const uuid_1 = require("uuid");
const history_1 = require("./history");
const database_1 = require("./database");
const events_1 = __importDefault(require("events"));
const log_1 = require("./log");
const log = new log_1.Log('mqtt');
//Contains data that all sparkplug classes should have
class SparkplugBasic {
    constructor({ id, timestamp }) {
        this.id = id;
        this.timestamp = timestamp;
        if (timestamp && typeof timestamp !== 'number') {
            this.updatedOn = new Date(timestamp.toNumber() * 1000);
        }
        else {
            this.updatedOn = timestamp ? new Date(timestamp * 1000) : new Date();
        }
    }
}
//For any sparkplug classes that have metrics
class SparkplugBasicMetrics extends SparkplugBasic {
    constructor(init) {
        super(init);
        this.metrics = [];
    }
    updateMetrics({ groupId, nodeId, deviceId }, history, payload) {
        if (payload.metrics) {
            for (const payloadMetric of payload.metrics) {
                if (payloadMetric.name) {
                    let metric = this.getMetric(payloadMetric.name);
                    if (metric) {
                        metric.update(payloadMetric);
                    }
                    else {
                        metric = new SparkplugMetric(Object.assign({ groupId, nodeId, deviceId, id: payloadMetric.name, timestamp: payloadMetric.timestamp }, payloadMetric));
                        this.metrics.push(metric);
                    }
                    history.log(metric);
                    log.info(`Metric ${metric.id} updated to value ${JSON.stringify(payloadMetric.value, null, 4)}`);
                }
            }
        }
    }
    getMetric(id) {
        return this.metrics.find((metrics) => id === metrics.id);
    }
}
class SparkplugMetric extends SparkplugBasicMetrics {
    constructor(init) {
        super(init);
        this.updateCount = 0;
        this.groupId = init.groupId;
        this.nodeId = init.nodeId;
        this.deviceId = init.deviceId;
        Object.assign(this, Object.assign(Object.assign({}, init), { timestamp: this.timestamp }));
    }
    update(update) {
        Object.assign(this, Object.assign({}, update));
        this.updateCount += 1;
    }
}
exports.SparkplugMetric = SparkplugMetric;
class SparkplugDevice extends SparkplugBasicMetrics {
    constructor(init) {
        super(init);
    }
    get children() {
        return this.metrics;
    }
}
class SparkplugNode extends SparkplugBasicMetrics {
    constructor(init) {
        super(init);
        this.devices = [];
        this.unbornDevices = [];
    }
    getDevice(id) {
        return this.devices.find((device) => id === device.id);
    }
    getUnbornDevice(id) {
        return this.unbornDevices.find((device) => id === device.id);
    }
    dropDevice(id) {
        this.devices = this.devices.filter((device) => {
            return device.id !== id;
        });
    }
    dropUnbornDevice(id) {
        this.unbornDevices = this.unbornDevices.filter((device) => {
            return device.id !== id;
        });
    }
    get children() {
        return this.devices;
    }
}
class SparkplugGroup extends SparkplugBasic {
    constructor(init) {
        super(init);
        this.nodes = [];
        this.unbornNodes = [];
    }
    getNode(id) {
        return this.nodes.find((node) => id === node.id);
    }
    getUnbornNode(id) {
        return this.unbornNodes.find((node) => id === node.id);
    }
    dropNode(id) {
        this.nodes = this.nodes.filter((node) => {
            return node.id !== id;
        });
    }
    dropUnbornNode(id) {
        this.unbornNodes = this.unbornNodes.filter((node) => {
            return node.id !== id;
        });
    }
    get children() {
        return this.nodes;
    }
}
class SparkplugData extends events_1.default.EventEmitter {
    constructor() {
        super();
        this.groups = [];
    }
    initialize({ serverUrl, username, password, }) {
        return __awaiter(this, void 0, void 0, function* () {
            this.groups = [];
            if (this.client) {
                this.client.stop();
                this.client = undefined;
            }
            this.client = (0, kraken_sparkplug_client_1.newHost)({
                serverUrl,
                username,
                password,
                clientId: process.env.MANTLE_CLIENT_ID || `mantle-${(0, uuid_1.v4)()}`,
                primaryHostId: process.env.MANTLE_PRIMARYHOST_ID || `mantle-${(0, uuid_1.v4)()}`,
            });
            this.history = yield history_1.History.initializeHistory(database_1.pool);
            this.createEvents();
            this.emit('update', this.groups);
        });
    }
    createEvents() {
        this.client.on('nbirth', (topic, groupId, nodeId, payload) => {
            let group = this.getGroup(groupId);
            if (group) {
                // Clear matching unborn nodes first
                group.dropUnbornNode(nodeId);
                let node = group.getNode(nodeId);
                if (node) {
                    node = new SparkplugNode({ id: nodeId, timestamp: payload.timestamp });
                }
                else {
                    node = new SparkplugNode({ id: nodeId, timestamp: payload.timestamp });
                    group.nodes.push(node);
                }
                node.updateMetrics({ groupId, nodeId }, this.history, payload);
                log.info(`Node ${node.id} is born in group ${group.id}.`);
            }
            else {
                group = new SparkplugGroup({ id: groupId, timestamp: payload.timestamp });
                this.groups.push(group);
                const node = new SparkplugNode({ id: nodeId, timestamp: payload.timestamp });
                group.nodes.push(node);
                node.updateMetrics({ groupId, nodeId }, this.history, payload);
                log.info(`Node ${node.id} is born as part of new group ${group.id}.`);
            }
            this.emit('update', this.groups);
        });
        this.client.on('dbirth', (_topic, groupId, nodeId, deviceId, payload) => {
            let group = this.getGroup(groupId);
            if (group) {
                let node = group.getNode(nodeId);
                if (node) {
                    node.dropUnbornDevice(deviceId);
                    if (payload.timestamp) {
                        node.updatedOn = new Date(payload.timestamp.toString());
                    }
                    let device = node.getDevice(deviceId);
                    if (device) {
                        device = new SparkplugDevice({ id: deviceId, timestamp: payload.timestamp });
                    }
                    else {
                        device = new SparkplugDevice({ id: deviceId, timestamp: payload.timestamp });
                        node.devices.push(device);
                    }
                    device.updateMetrics({ groupId, nodeId, deviceId }, this.history, payload);
                    log.info(`Device ${device.id} is born to Node ${node.id} in group ${group.id}.`);
                }
                else {
                    node = group.getUnbornNode(nodeId);
                    if (node) {
                        node.dropUnbornDevice(deviceId);
                        if (payload.timestamp) {
                            node.updatedOn = new Date(payload.timestamp.toString());
                        }
                        let device = node.getDevice(deviceId);
                        if (device) {
                            device = new SparkplugDevice({ id: deviceId, timestamp: payload.timestamp });
                        }
                        else {
                            device = new SparkplugDevice({ id: deviceId, timestamp: payload.timestamp });
                            node.devices.push(device);
                        }
                    }
                    else {
                        node = new SparkplugNode({ id: nodeId, timestamp: payload.timestamp });
                        group.unbornNodes.push(node);
                        let device = new SparkplugDevice({ id: deviceId, timestamp: payload.timestamp });
                        node.devices.push(device);
                        device.updateMetrics({ groupId, nodeId, deviceId }, this.history, payload);
                        log.info(`Device ${device.id} is born to unborn Node ${node.id} in group ${group.id}.`);
                    }
                }
            }
            else {
                group = new SparkplugGroup({ id: groupId, timestamp: payload.timestamp });
                this.groups.push(group);
                const node = new SparkplugNode({ id: nodeId, timestamp: payload.timestamp });
                group.unbornNodes.push(node);
                let device = new SparkplugDevice({ id: deviceId, timestamp: payload.timestamp });
                node.devices.push(device);
                device.updateMetrics({ groupId, nodeId, deviceId }, this.history, payload);
                log.info(`Device ${device.id} is born to unborn Node ${node.id} in new group ${group.id}.`);
            }
            this.emit('update', this.groups);
        });
        this.client.on('ddata', (_topic, groupId, nodeId, deviceId, payload) => {
            let group = this.getGroup(groupId);
            if (group) {
                let node = group.getNode(nodeId);
                if (node) {
                    if (payload.timestamp) {
                        node.updatedOn = new Date(payload.timestamp.toString());
                    }
                    let device = node.getDevice(deviceId);
                    if (device) {
                        log.info(`Received data for ${device.id} in Node ${node.id} in Group ${group.id}:`);
                        device.updateMetrics({ groupId, nodeId, deviceId }, this.history, payload);
                    }
                    else {
                        device = new SparkplugDevice({ id: deviceId, timestamp: payload.timestamp });
                        node.unbornDevices.push(device);
                        device.updateMetrics({ groupId, nodeId, deviceId }, this.history, payload);
                        log.info(`Received data for unborn device ${device.id} in Node ${node.id} in ${group.id}`);
                    }
                }
                else {
                    node = group.getUnbornNode(nodeId);
                    if (node) {
                        let device = node.getDevice(deviceId);
                        if (device) {
                            log.info(`Received data for ${device.id} in Node ${node.id} in Group ${group.id}:`);
                            device.updateMetrics({ groupId, nodeId, deviceId }, this.history, payload);
                        }
                        else {
                            device = node.getUnbornDevice(deviceId);
                            if (device) {
                                device.updateMetrics({ groupId, nodeId, deviceId }, this.history, payload);
                            }
                            else {
                                device = new SparkplugDevice({ id: deviceId, timestamp: payload.timestamp });
                                node.unbornDevices.push(device);
                                device.updateMetrics({ groupId, nodeId, deviceId }, this.history, payload);
                            }
                            log.info(`Received data for unborn device ${device.id} in Node ${node.id} in ${group.id}`);
                        }
                    }
                    else {
                        node = new SparkplugNode({ id: nodeId, timestamp: payload.timestamp });
                        group.unbornNodes.push(node);
                        let device = new SparkplugDevice({ id: deviceId, timestamp: payload.timestamp });
                        node.unbornDevices.push(device);
                        device.updateMetrics({ groupId, nodeId, deviceId }, this.history, payload);
                        log.info(`Received data for unborn device ${device.id} in unborn Node ${node.id} in group ${group.id}.`);
                    }
                }
            }
            else {
                group = new SparkplugGroup({ id: groupId, timestamp: payload.timestamp });
                this.groups.push(group);
                const node = new SparkplugNode({ id: nodeId, timestamp: payload.timestamp });
                group.unbornNodes.push(node);
                let device = new SparkplugDevice({ id: deviceId, timestamp: payload.timestamp });
                node.unbornDevices.push(device);
                device.updateMetrics({ groupId, nodeId, deviceId }, this.history, payload);
                log.info(`Received data for unborn device ${device.id} in unborn Node ${node.id} in new group ${group.id}.`);
            }
            this.emit('update', this.groups);
        });
        this.client.on('ndeath', (_topic, groupId, nodeId, _payload) => {
            let group = this.getGroup(groupId);
            if (group) {
                group.dropNode(nodeId);
                group.dropUnbornNode(nodeId);
            }
            log.info(`Node ${nodeId} is dead on group ${groupId}`);
            this.emit('update', this.groups);
        });
        this.client.on('ddeath', (_topic, groupId, nodeId, deviceId, _payload) => {
            let group = this.getGroup(groupId);
            if (group) {
                let node = group.getNode(nodeId);
                if (node) {
                    node.dropDevice(deviceId);
                    node.dropUnbornDevice(deviceId);
                }
            }
            log.info(`Device ${deviceId} is dead on node ${nodeId} in group ${groupId}`);
            this.emit('update', this.groups);
        });
        this.client.on('connect', () => {
            console.log('connecting');
        });
        this.client.on('reconnect', () => {
            console.log('reconnecting');
        });
        this.client.on('error', (error) => {
            console.log(error.message);
        });
        this.client.on('ncmd', (payload) => {
            console.log(payload);
        });
        this.client.on('message', (topic, payload) => {
            console.log(`received message on topic "${topic}" with payload "${JSON.stringify(payload, null, 4)}"`);
        });
    }
    getGroup(id) {
        return this.groups.find((group) => id === group.id);
    }
    requestRebirth({ groupId, nodeId }) {
        var _a;
        const payload = {
            timestamp: new Date().getTime(),
            metrics: [{
                    name: "Node Control/Rebirth",
                    value: true,
                    type: "Boolean",
                    timestamp: new Date().getTime(),
                    properties: {}
                }]
        };
        (_a = this.client) === null || _a === void 0 ? void 0 : _a.publishNodeCommand(groupId, nodeId, payload);
    }
    sendNodeCommand({ groupId, nodeId, metricId, value }) {
        var _a, _b, _c;
        const metric = (_b = (_a = this.getGroup(groupId)) === null || _a === void 0 ? void 0 : _a.getNode(nodeId)) === null || _b === void 0 ? void 0 : _b.getMetric(metricId);
        if (metric) {
            const payload = {
                timestamp: new Date().getTime(),
                metrics: [Object.assign(Object.assign({}, metric), { value })]
            };
            (_c = this.client) === null || _c === void 0 ? void 0 : _c.publishNodeCommand(groupId, nodeId, payload);
        }
    }
    sendDeviceCommand({ groupId, nodeId, deviceId, metricId, value }) {
        var _a, _b, _c, _d;
        const metric = (_c = (_b = (_a = this.getGroup(groupId)) === null || _a === void 0 ? void 0 : _a.getNode(nodeId)) === null || _b === void 0 ? void 0 : _b.getDevice(deviceId)) === null || _c === void 0 ? void 0 : _c.getMetric(metricId);
        if (metric) {
            const payload = {
                timestamp: new Date().getTime(),
                metrics: [Object.assign(Object.assign({}, metric), { value: JSON.stringify(value) })]
            };
            (_d = this.client) === null || _d === void 0 ? void 0 : _d.publishDeviceCommand(groupId, nodeId, deviceId, payload);
        }
    }
    startAutoRebirth(rate = 10000) {
        this.autoRebirthInterval = setInterval(() => {
            this.groups.forEach((group) => {
                group.unbornNodes.forEach((node) => {
                    this.requestRebirth({ groupId: group.id, nodeId: node.id });
                });
            });
        }, rate);
    }
    stopAutoRebirth() {
        clearInterval(this.autoRebirthInterval);
    }
}
exports.spdata = new SparkplugData();
