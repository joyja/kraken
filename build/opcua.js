"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Opcua = void 0;
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
const node_opcua_1 = require("node-opcua");
const node_opcua_client_crawler_1 = require("node-opcua-client-crawler");
const log_1 = require("./log");
const log = new log_1.Log('OPCUA');
class Opcua {
    host;
    port;
    retryRate;
    connected;
    error;
    retryCount;
    nodes;
    client;
    session;
    retryInterval;
    constructor({ initialDelay = 1000, maxRetry = 1, applicationName = 'tentacle-plc', host, port, retryRate }) {
        this.host = host;
        this.port = port;
        this.retryRate = retryRate;
        this.connected = false;
        this.error = null;
        this.retryCount = 0;
        this.nodes = null;
        const options = {
            applicationName,
            connectionStrategy: {
                initialDelay,
                maxRetry
            },
            securityMode: node_opcua_1.MessageSecurityMode.None,
            securityPolicy: node_opcua_1.SecurityPolicy.None,
            endpointMustExist: false
        };
        this.client = node_opcua_1.OPCUAClient.create(options);
        this.client.on('connection_failed', () => {
            if (this.connected) {
                void this.disconnect().then(() => {
                    void this.connect();
                });
            }
        });
        this.client.on('connection_lost', () => {
            if (this.connected) {
                void this.disconnect().then(() => {
                    void this.connect();
                });
            }
        });
    }
    async connect() {
        if (!this.connected) {
            this.error = null;
            log.info(`Connecting to opcua device, host: ${this.host}, port: ${this.port}.`);
            await this.client.connect(`opc.tcp://${this.host}:${this.port}`).catch((error) => {
                this.error = error.message;
                this.connected = false;
                if (!this.retryInterval) {
                    this.retryInterval = setInterval(() => {
                        log.info(`Retrying connection to opcua device, retry attempts: ${this.retryCount}.`);
                        this.retryCount += 1;
                        void this.connect();
                    }, this.retryRate);
                }
            });
            if (!this.error !== null) {
                this.retryCount = 0;
                clearInterval(this.retryInterval);
                log.info(`Connected to opcua device, host: ${this.host}, port: ${this.port}.`);
                this.connected = true;
                this.session = await this.client.createSession();
            }
            else {
                this.connected = false;
                log.info(`Connection failed to opcua device, host: ${this.host}, port: ${this.port}, with error: ${this.error}.`);
            }
        }
    }
    async disconnect() {
        this.retryCount = 0;
        clearInterval(this.retryInterval);
        log.info(`Disconnecting from modbus device`);
        const logText = `Closed connection to modbus device.`;
        if (this.connected) {
            await this.client.disconnect();
            log.info(logText);
        }
        else {
            log.info(logText);
        }
        this.connected = false;
    }
    async browse(nodeId, flat = false) {
        if (this.connected) {
            return await new Promise((resolve, reject) => {
                if (!this.session) {
                    reject(new Error('No session'));
                    return;
                }
                const crawler = new node_opcua_client_crawler_1.NodeCrawler(this.session);
                const flatResult = [];
                if (flat) {
                    crawler.on('browsed', (element) => {
                        if (element.dataValue) {
                            flatResult.push({
                                nodeId: element.nodeId.toString(),
                                browseName: `${element.nodeId.toString()},${element.browseName.name}`
                            });
                        }
                    });
                }
                crawler.read(nodeId || 'ObjectsFolder', (err, obj) => {
                    if (!err) {
                        if (flat) {
                            resolve(flatResult);
                        }
                        else {
                            resolve(obj);
                        }
                    }
                    else {
                        reject(err);
                    }
                });
            });
        }
        else {
            return flat ? [] : null;
        }
    }
    async read({ nodeIds }) {
        if (this.connected) {
            try {
                const results = await this.session?.read(nodeIds.map((nodeId) => {
                    return {
                        nodeId,
                        attributeId: node_opcua_1.AttributeIds.Value
                    };
                })).catch((error) => { console.error(error); });
                return results?.map((result) => {
                    return result.value.value;
                });
            }
            catch (error) {
                console.error(error);
            }
        }
    }
    async write({ inputValue, nodeId, registerType }) {
        if (this.connected) {
            let dataType;
            let value;
            if (registerType === 'BOOLEAN') {
                dataType = node_opcua_1.DataType.Boolean;
                value = inputValue + '' === 'true';
            }
            else if (registerType === 'FLOAT') {
                dataType = node_opcua_1.DataType.Float;
                value = parseFloat(inputValue);
            }
            else if (registerType === 'DOUBLE') {
                dataType = node_opcua_1.DataType.Double;
                value = parseFloat(inputValue);
            }
            else if (registerType === 'INT16') {
                dataType = node_opcua_1.DataType.Int16;
                value = parseInt(inputValue);
            }
            else if (registerType === 'INT32') {
                dataType = node_opcua_1.DataType.Int32;
                value = parseInt(inputValue);
            }
            else {
                dataType = node_opcua_1.DataType.String;
                value = inputValue;
            }
            const nodeToWrite = {
                nodeId,
                attributeId: node_opcua_1.AttributeIds.Value,
                value: {
                    value: {
                        dataType,
                        value
                    }
                }
            };
            await this.session?.write(nodeToWrite).catch((error) => { console.error(error); });
        }
    }
}
exports.Opcua = Opcua;
