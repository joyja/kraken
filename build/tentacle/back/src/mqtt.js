"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mqtt = void 0;
const kraken_sparkplug_client_1 = require("kraken-sparkplug-client");
const date_fns_1 = require("date-fns");
const lodash_1 = __importDefault(require("lodash"));
const denormalize_1 = require("./denormalize");
const getDatatype = function (value) {
    if (typeof value === 'boolean') {
        return 'BOOLEAN';
    }
    if (typeof value === 'string') {
        return 'STRING';
    }
    if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return 'INT32';
        }
        return 'FLOAT';
    }
    console.error(`datatype of ${value} could not be determined.`);
    return 'STRING';
};
class Mqtt {
    queue;
    rate;
    global;
    prevGlobal;
    deviceName;
    client;
    interval;
    primaryHosts;
    maxHistoryToPublish;
    config;
    constructor({ serverUrl = 'tcp://localhost:1883', username, password, groupId, edgeNode, deviceName, rate, clientId, version = 'spBv1.0', global, primaryHosts = [], maxHistoryToPublish = 10, }) {
        this.queue = [];
        this.rate = rate;
        this.global = global;
        this.prevGlobal = JSON.parse(JSON.stringify(this.denormalizedGlobal));
        this.deviceName = deviceName;
        this.config = {
            serverUrl,
            username,
            password,
            groupId,
            edgeNode,
            clientId,
            version,
            publishDeath: true,
        };
        this.primaryHosts = primaryHosts.map((name) => ({
            name,
            readyForData: false,
            status: 'OFFLINE',
            history: [],
        }));
        this.maxHistoryToPublish = maxHistoryToPublish;
    }
    get denormalizedGlobal() {
        return (0, denormalize_1.denormalize)(this.global);
    }
    async publish() {
        console.log(this.queue);
        if (this.queue.length > 0) {
            const record = {
                timestamp: (0, date_fns_1.getUnixTime)(new Date()),
                metrics: [...this.queue],
            };
            await this.client.publishDeviceData(this.deviceName, record);
            for (const host of this.primaryHosts) {
                if (host?.readyForData === null || host?.readyForData === undefined) {
                    host.history.push({ ...record, isHistorical: true });
                }
                else {
                    const historyToPublish = host.history.splice(0, this.maxHistoryToPublish - 1);
                    for (const storedRecord of historyToPublish) {
                        await this.client.publishDeviceData(this.deviceName, storedRecord);
                    }
                }
            }
            this.queue = [];
        }
    }
    startPublishing() {
        clearInterval(this.interval);
        this.interval = setInterval(() => {
            void this.publish();
        }, this.rate);
    }
    stopPublishing() {
        clearInterval(this.interval);
    }
    connect() {
        this.stopPublishing();
        if (this.client === null || this.client === undefined) {
            this.client = (0, kraken_sparkplug_client_1.newClient)(this.config);
            this.client.on('reconnect', () => {
                void this.onReconnect();
            });
            // this.client.on('error',this.onError)
            // this.client.on('offline',this.onOffline)
            this.client.on('birth', () => {
                void this.onBirth();
            });
            this.client.on('dcmd', (deviceId, payload) => {
                console.log(`Mqtt service received a dcmd for ${deviceId}.`);
                try {
                    this.onDcmd(payload);
                }
                catch (error) {
                    console.log(error);
                }
            });
            this.client.on('ncmd', async (payload) => {
                if (payload.metrics !== null && payload.metrics !== undefined) {
                    const rebirth = payload.metrics.find((metric) => metric.name === `Node Control/Rebirth`);
                    if (rebirth?.value !== null && rebirth?.value !== undefined) {
                        console.log(`Rebirth request detected. Reinitializing...`);
                        await this.disconnect();
                        this.connect();
                    }
                }
            });
        }
    }
    async disconnect() {
        if (this.client !== null && this.client !== undefined) {
            console.log(`Mqtt service is disconnecting.`);
            this.stopPublishing();
            const payload = {
                timestamp: (0, date_fns_1.getUnixTime)(new Date()),
            };
            await this.client.publishDeviceDeath(`${this.deviceName}`, payload);
            this.client.stop();
            this.client = undefined;
        }
    }
    onDcmd(payload) {
        const { metrics } = payload;
        if (metrics != null) {
            metrics.forEach((metric) => {
                if (metric.name !== null && metric.name !== undefined) {
                    const variablePath = metric.name
                        .replace('functions/', '')
                        .replaceAll('/', '.');
                    const variable = lodash_1.default.get(this.global, variablePath);
                    if (variable !== undefined) {
                        if (typeof variable === 'boolean') {
                            lodash_1.default.set(this.global, variablePath, (typeof metric.value === 'string' && metric.value === 'true') ||
                                (typeof metric.value === 'boolean' && metric.value));
                        }
                        else if (typeof variable === 'function') {
                            // * Need to call the function from the parent to preserve 'this' in classes.
                            // * So pop off the function name, get the parent and call the function from the parent.
                            const variablePathParts = variablePath.split('.');
                            const functionName = variablePathParts.pop();
                            const parent = lodash_1.default.get(this.global, variablePathParts.join('.'));
                            if (variable.length === 0 && (functionName !== null && functionName !== undefined)) {
                                parent[functionName]();
                            }
                            else if ((functionName !== null && functionName !== undefined) && typeof metric.value === 'string') {
                                parent[functionName](...JSON.parse(metric.value));
                            }
                            else {
                                console.log('Invalid function call.');
                            }
                        }
                    }
                    else {
                        console.log(`${variablePath} does not exits.`);
                    }
                }
            });
        }
    }
    async onBirth() {
        const payload = {
            timestamp: (0, date_fns_1.getUnixTime)(new Date()),
            metrics: [
                {
                    name: 'Node Control/Rebirth',
                    timestamp: (0, date_fns_1.getUnixTime)(new Date()),
                    type: 'Boolean',
                    value: false,
                },
            ],
        };
        await this.client.publishNodeBirth(payload);
        const global = this.denormalizedGlobal;
        const metrics = Object.keys(global).map((key) => {
            if (typeof global[key] === 'string' && (global[key]?.includes('function') !== null || global[key]?.includes('function') !== undefined)) {
                const keyParts = key.split('.');
                keyParts.splice(keyParts.length - 1, 0, 'functions');
                return {
                    name: keyParts.join('/'),
                    value: global[key] === 'function0'
                        ? false
                        : `[${','.repeat(parseInt(global[key].replace('function', '')) - 1)}]`,
                    type: global[key] === 'function0' ? 'BOOLEAN' : 'STRING',
                    timestamp: (0, date_fns_1.getUnixTime)(new Date()),
                };
            }
            return {
                name: key.replaceAll('.', '/'),
                value: global[key],
                type: getDatatype(global[key]),
                timestamp: (0, date_fns_1.getUnixTime)(new Date()),
            };
        });
        await this.client.publishDeviceBirth(`${this.deviceName}`, {
            timestamp: (0, date_fns_1.getUnixTime)(new Date()),
            metrics,
        });
        this.primaryHosts.forEach((host) => {
            if (host.status === `ONLINE` || host.status === `UNKOWN`) {
                host.readyForData = true;
            }
        });
        this.client.on('state', (primaryHostId, state) => {
            if (primaryHostId !== null && primaryHostId !== undefined) {
                this.primaryHosts
                    .filter((host) => host.name === primaryHostId)
                    .forEach((host) => {
                    console.log(`Received state: ${state} for primary host: ${primaryHostId}`);
                    if (host !== null && host !== undefined) {
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
exports.Mqtt = Mqtt;
