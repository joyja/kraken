"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mqtt = exports.MQTT = exports.MQTTData = void 0;
const kraken_sparkplug_client_1 = require("kraken-sparkplug-client");
const getUnixTime_1 = __importDefault(require("date-fns/getUnixTime"));
const index_1 = require("../log/index");
const log = new index_1.Log('MQTT');
const getDatatype = function (value) {
    if (typeof value === 'boolean') {
        return 'BOOLEAN';
    }
    else if (typeof value === 'string') {
        return 'STRING';
    }
    else if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return 'INT32';
        }
        else {
            return 'FLOAT';
        }
    }
    else {
        throw Error(`The datatype of ${value} could not be determined.`);
    }
};
class MQTTData {
    interval;
    metrics;
    deviceControl;
    constructor(metrics, deviceControl) {
        this.metrics = metrics;
        this.deviceControl = deviceControl;
    }
    async initializeMetrics() {
        await Promise.all(this.metrics.map(async (metric) => {
            exports.mqtt.addMetric({
                name: metric.name,
                value: await metric.getter(),
                type: metric.type
            });
        }));
        if (this.deviceControl) {
            await Promise.all(this.deviceControl?.map(async (control) => {
                exports.mqtt.addMetric({
                    name: `Device Control/${control.name}`,
                    value: control.args && control.args.length > 0 ? JSON.stringify(control.args) : false,
                    type: control.args && control.args.length > 0 ? 'String' : 'Boolean',
                    action: control.action
                });
            }));
        }
    }
    async updateMetrics() {
        await Promise.all(this.metrics.map(async (metric) => {
            exports.mqtt.updateMetric({
                name: metric.name,
                value: await metric.getter(),
            });
        }));
    }
    async startPolling(rate) {
        this.interval = setInterval(() => {
            this.updateMetrics();
        }, rate);
    }
    async stopPolling() {
        clearInterval(this.interval);
    }
}
exports.MQTTData = MQTTData;
class MQTT {
    client;
    connecting;
    connected;
    primaryHosts;
    metrics;
    groupId;
    nodeId;
    deviceId;
    interval;
    rate;
    config;
    constructor() {
        const serverUrl = process.env.SQUID_MQTT_URL;
        const username = process.env.SQUID_MQTT_USERNAME;
        const password = process.env.SQUID_MQTT_PASSWORD;
        const groupId = process.env.SQUID_MQTT_GROUPID;
        this.groupId = groupId;
        const edgeNode = process.env.SQUID_MQTT_EDGENODE;
        this.nodeId = edgeNode;
        this.deviceId = process.env.SQUID_MQTT_DEVICEID;
        const clientId = process.env.SQUID_MQTT_CLIENTID;
        // TODO: Need to figure out how I'm going to populate primary hosts (event variable, config file, etc.)
        const primaryHosts = [];
        this.rate = 2500;
        this.config = {
            serverUrl, username, password, groupId, edgeNode, clientId,
            version: 'spBv1.0',
            publishDeath: true
        };
        this.metrics = [];
        this.primaryHosts = primaryHosts.map((name) => {
            return {
                name,
                readyForData: false,
                status: 'OFFLINE',
                history: []
            };
        });
        for (const [key, value] of Object.entries(this.config)) {
            if (!value) {
                throw Error(`${key} is not set, please make sure you set the SQUID_${key.toUpperCase()} environment variable.`);
            }
        }
        this.connecting = false;
        this.connected = false;
    }
    async publish() {
        const metrics = this.metrics.filter(metric => !metric.published);
        if (metrics.length > 0) {
            const record = {
                timestamp: (0, getUnixTime_1.default)(new Date()),
                metrics,
            };
            await this.client.publishDeviceData(this.deviceId, record);
        }
        this.metrics?.forEach((metric) => {
            metric.published = true;
        });
    }
    async sendDeviceCommand({ groupId, nodeId, deviceId, payload, options }) {
        return this.client.publishDeviceCommand(groupId, nodeId, deviceId, payload, options);
    }
    async sendNodeCommand({ groupId, nodeId, payload, options }) {
        return this.client.publishNodeCommand(groupId, nodeId, payload, options);
    }
    addMetric({ name, type, value, action }) {
        this.metrics?.push({
            name,
            type,
            value,
            timestamp: (0, getUnixTime_1.default)(new Date()),
            published: false,
            action
        });
    }
    updateMetric({ name, value }) {
        const metric = this.metrics?.find((metric) => {
            return name === metric.name;
        });
        if (metric) {
            if (metric.value !== value) {
                metric.value = value;
                metric.timestamp = (0, getUnixTime_1.default)(new Date());
                metric.published = false;
            }
        }
        else {
            throw Error(`metric with name ${name} does not exist.`);
        }
    }
    startPublishing(rate) {
        if (rate) {
            this.rate = rate;
        }
        if (this.interval) {
            clearInterval(this.interval);
        }
        this.interval = setInterval(() => {
            this.publish();
        }, this.rate);
    }
    stopPublishing() {
        clearInterval(this.interval);
    }
    connect() {
        if (!this.client) {
            this.client = (0, kraken_sparkplug_client_1.newClient)(this.config);
            this.client.on('reconnect', () => {
                this.onReconnect();
            });
            // this.client.on('error',this.onError)
            // this.client.on('offline',this.onOffline)
            this.client.on('birth', () => {
                this.onBirth();
            });
            this.client.on('dcmd', (deviceId, payload) => {
                log.info(`Mqtt service received a dcmd for ${deviceId}. My device id is ${this.deviceId}, so ${this.deviceId === deviceId ? 'This is for me.' : 'This is not for me.'}`);
                log.debug(`dcmd payload: ${JSON.stringify(payload, null, 2)}`);
                try {
                    if (this.deviceId === deviceId) {
                        if (payload.metrics) {
                            payload.metrics.forEach((payloadMetric) => {
                                const deviceCommand = this.metrics.find((metric) => {
                                    return metric.name === payloadMetric.name;
                                });
                                log.debug(`${deviceCommand ? 'Found' : 'Did not find'} device command for ${payloadMetric.name}`);
                                if (!deviceCommand) {
                                    log.debug(`Available metrics are ${JSON.stringify(this.metrics, null, 2)}`);
                                }
                                if (deviceCommand?.action) {
                                    if (deviceCommand.type === 'Boolean') {
                                        deviceCommand.action();
                                    }
                                    else {
                                        deviceCommand.action(JSON.parse(payloadMetric.value));
                                    }
                                }
                            });
                        }
                    }
                }
                catch (error) {
                    log.error(log.getErrorMessage(error));
                }
            });
            this.client.on('ncmd', async (payload) => {
                if (payload.metrics) {
                    const rebirth = payload.metrics.find((metric) => metric.name === `Node Control/Rebirth`);
                    if (rebirth) {
                        if (rebirth.value) {
                            log.info(`Rebirth request detected. Reinitializing...`);
                            this.stopPublishing();
                            await this.disconnect();
                            this.connect();
                            this.startPublishing();
                        }
                    }
                }
            });
        }
    }
    async disconnect() {
        if (this.client) {
            log.info(`Mqtt service is disconnecting.`);
            this.stopPublishing();
            const payload = {
                timestamp: (0, getUnixTime_1.default)(new Date()),
            };
            await this.client.publishDeviceDeath(`${this.deviceId}`, payload);
            this.client.stop();
            this.client = undefined;
        }
    }
    async onBirth() {
        const payload = {
            timestamp: (0, getUnixTime_1.default)(new Date()),
            metrics: [
                {
                    name: 'Node Control/Rebirth',
                    timestamp: (0, getUnixTime_1.default)(new Date()),
                    type: "Boolean",
                    value: false,
                }
            ],
        };
        await this.client.publishNodeBirth(payload);
        const metrics = this.metrics;
        await this.client.publishDeviceBirth(`${this.deviceId}`, {
            timestamp: (0, getUnixTime_1.default)(new Date()),
            metrics,
        });
        this.primaryHosts.forEach((host) => {
            if (host.status === `ONLINE` || host.status === `UNKOWN`) {
                host.readyForData = true;
            }
        });
        this.client.on('state', (primaryHostId, state) => {
            if (primaryHostId) {
                const primaryHost = this.primaryHosts
                    .filter((host) => host.name === primaryHostId)
                    .forEach((host) => {
                    log.info(`Received state: ${state} for primary host: ${primaryHostId}`);
                    if (host) {
                        host.status = `${state}`;
                        if (`${state}` === `OFFLINE`) {
                            host.readyForData = false;
                        }
                        if (`${state}` === `ONLINE`) {
                            host.readyForData = true;
                        }
                    }
                });
            }
        });
        this.startPublishing();
    }
    async onReconnect() {
        this.stopPublishing();
        this.startPublishing();
    }
}
exports.MQTT = MQTT;
exports.mqtt = new MQTT();
