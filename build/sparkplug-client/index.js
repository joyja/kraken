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
exports.newHost = exports.newClient = void 0;
/**
 * Copyright (c) 2016-2017 Cirrus Link Solutions
 *
 *  All rights reserved. This program and the accompanying materials
 *  are made available under the terms of the Eclipse Public License v1.0
 *  which accompanies this distribution, and is available at
 *  http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *   Cirrus Link Solutions
 */
const mqtt = __importStar(require("mqtt"));
const events_1 = __importDefault(require("events"));
const sparkplug = __importStar(require("sparkplug-payload"));
const pako_1 = __importDefault(require("pako"));
const debug_1 = __importDefault(require("debug"));
const sparkplugbpayload = sparkplug.get("spBv1.0");
const compressed = "SPBV1.0_COMPRESSED";
// setup logging
const debugLog = (0, debug_1.default)('sparkplug-client:debug');
const infoLog = (0, debug_1.default)('sparkplug-client:info');
const logger = {
    debug: (formatter, ...args) => debugLog(formatter, ...args),
    info: (formatter, ...args) => infoLog(formatter, ...args),
};
function getRequiredProperty(config, propName) {
    if (config[propName] !== undefined) {
        return config[propName];
    }
    throw new Error("Missing required configuration property '" + propName + "'");
}
function getProperty(config, propName, defaultValue) {
    if (config[propName] !== undefined) {
        return config[propName];
    }
    else {
        return defaultValue;
    }
}
/*
 * Sparkplug Client
 */
class SparkplugClient extends events_1.default.EventEmitter {
    // Constants
    type_int32 = 7;
    type_boolean = 11;
    type_string = 12;
    versionB = "spBv1.0";
    // Config Variables
    serverUrl;
    groupId;
    edgeNode;
    publishDeath;
    version;
    mqttOptions;
    // MQTT Client Variables
    bdSeq = 0;
    seq = 0;
    client = null;
    connecting = false;
    connected = false;
    constructor(config) {
        super();
        this.groupId = getRequiredProperty(config, "groupId");
        this.edgeNode = getRequiredProperty(config, "edgeNode");
        this.publishDeath = getProperty(config, "publishDeath", false);
        this.version = getProperty(config, "version", this.versionB);
        // Client connection options
        this.serverUrl = getRequiredProperty(config, "serverUrl");
        const username = getRequiredProperty(config, "username");
        const password = getRequiredProperty(config, "password");
        const clientId = getRequiredProperty(config, "clientId");
        const keepalive = getProperty(config, "keepalive", 5);
        this.mqttOptions = {
            ...config.mqttOptions || {}, // allow additional options
            clientId,
            clean: true,
            keepalive,
            reschedulePings: false,
            connectTimeout: 30000,
            username,
            password,
            will: {
                topic: this.version + "/" + this.groupId + "/NDEATH/" + this.edgeNode,
                payload: Buffer.from(this.encodePayload(this.getDeathPayload())),
                qos: 0,
                retain: false,
            },
        };
        this.init();
    }
    // Increments a sequence number
    incrementSeqNum() {
        if (this.seq == 256) {
            this.seq = 0;
        }
        return this.seq++;
    }
    encodePayload(payload) {
        return sparkplugbpayload.encodePayload(payload);
    }
    ;
    decodePayload(payload) {
        return sparkplugbpayload.decodePayload(payload);
    }
    addSeqNumber(payload) {
        payload.seq = this.incrementSeqNum();
    }
    // Get DEATH payload
    getDeathPayload() {
        return {
            "timestamp": new Date().getTime(),
            "metrics": [{
                    "name": "bdSeq",
                    "value": this.bdSeq,
                    "type": "uint64"
                }]
        };
    }
    // Publishes DEATH certificates for the edge node
    publishNDeath(client) {
        let payload, topic;
        // Publish DEATH certificate for edge node
        logger.info("Publishing Edge Node Death");
        payload = this.getDeathPayload();
        topic = this.version + "/" + this.groupId + "/NDEATH/" + this.edgeNode;
        client.publish(topic, Buffer.from(this.encodePayload(payload)));
        this.messageAlert("published", topic, payload);
    }
    // Logs a message alert to the console
    messageAlert(alert, topic, payload) {
        logger.debug("Message " + alert);
        logger.debug(" topic: " + topic);
        logger.debug(" payload: " + JSON.stringify(payload));
    }
    compressPayload(payload, options) {
        let algorithm = null, compressedPayload, resultPayload = {
            "uuid": compressed,
            "metrics": []
        };
        logger.debug("Compressing payload " + JSON.stringify(options));
        // See if any options have been set
        if (options !== undefined && options !== null) {
            // Check algorithm
            if (options['algorithm']) {
                algorithm = options['algorithm'];
            }
        }
        if (algorithm === null || algorithm.toUpperCase() === "DEFLATE") {
            logger.debug("Compressing with DEFLATE!");
            resultPayload.body = pako_1.default.deflate(payload);
        }
        else if (algorithm.toUpperCase() === "GZIP") {
            logger.debug("Compressing with GZIP");
            resultPayload.body = pako_1.default.gzip(payload);
        }
        else {
            throw new Error("Unknown or unsupported algorithm " + algorithm);
        }
        // Create and add the algorithm metric if is has been specified in the options
        if (algorithm !== null) {
            resultPayload.metrics = [{
                    "name": "algorithm",
                    "value": algorithm.toUpperCase(),
                    "type": "String"
                }];
        }
        return resultPayload;
    }
    decompressPayload(payload) {
        let metrics = payload.metrics || [], algorithm = null;
        const body = payload.body || new Uint8Array();
        logger.debug("Decompressing payload");
        const algorithmMetric = metrics.find(m => m.name === 'algorithm');
        if (algorithmMetric && typeof algorithmMetric.value === 'string') {
            algorithm = algorithmMetric.value;
        }
        if (algorithm === null || algorithm.toUpperCase() === "DEFLATE") {
            logger.debug("Decompressing with DEFLATE!");
            return pako_1.default.inflate(body);
        }
        else if (algorithm.toUpperCase() === "GZIP") {
            logger.debug("Decompressing with GZIP");
            return pako_1.default.ungzip(body);
        }
        else {
            throw new Error("Unknown or unsupported algorithm " + algorithm);
        }
    }
    maybeCompressPayload(payload, options) {
        if (options?.compress) {
            // Compress the payload
            return this.compressPayload(this.encodePayload(payload), options);
        }
        else {
            // Don't compress the payload
            return payload;
        }
    }
    maybeDecompressPayload(payload) {
        if (payload.uuid !== undefined && payload.uuid === compressed) {
            // Decompress the payload
            return this.decodePayload(this.decompressPayload(payload));
        }
        else {
            // The payload is not compressed
            return payload;
        }
    }
    subscribeTopic(topic, options = { "qos": 0 }, callback) {
        logger.info("Subscribing to topic:", topic);
        this.client.subscribe(topic, options, callback);
    }
    unsubscribeTopic(topic, options, callback) {
        logger.info("Unsubscribing topic:", topic);
        this.client.unsubscribe(topic, options, callback);
    }
    // Publishes Node BIRTH certificates for the edge node
    publishNodeBirth(payload, options) {
        let topic = this.version + "/" + this.groupId + "/NBIRTH/" + this.edgeNode;
        // Reset sequence number
        this.seq = 0;
        // Add seq number
        this.addSeqNumber(payload);
        // Add bdSeq number
        let metrics = payload.metrics;
        if (metrics !== undefined && metrics !== null) {
            metrics.push({
                "name": "bdSeq",
                "type": "UInt64",
                "value": this.bdSeq
            });
        }
        // Publish BIRTH certificate for edge node
        logger.info("Publishing Edge Node Birth");
        let p = this.maybeCompressPayload(payload, options);
        this.client.publish(topic, Buffer.from(this.encodePayload(p)));
        this.messageAlert("published", topic, p);
    }
    // Publishes Node Data messages for the edge node
    publishNodeData(payload, options) {
        let topic = this.version + "/" + this.groupId + "/NDATA/" + this.edgeNode;
        // Add seq number
        this.addSeqNumber(payload);
        // Publish
        logger.info("Publishing NDATA");
        this.client.publish(topic, Buffer.from(this.encodePayload(this.maybeCompressPayload(payload, options))));
        this.messageAlert("published", topic, payload);
    }
    // Publishes Node BIRTH certificates for the edge node
    publishDeviceData(deviceId, payload, options) {
        let topic = this.version + "/" + this.groupId + "/DDATA/" + this.edgeNode + "/" + deviceId;
        // Add seq number
        this.addSeqNumber(payload);
        // Publish
        logger.info("Publishing DDATA for device " + deviceId);
        this.client.publish(topic, Buffer.from(this.encodePayload(this.maybeCompressPayload(payload, options))));
        this.messageAlert("published", topic, payload);
    }
    ;
    // Publishes Node BIRTH certificates for the edge node
    publishDeviceBirth(deviceId, payload, options) {
        let topic = this.version + "/" + this.groupId + "/DBIRTH/" + this.edgeNode + "/" + deviceId;
        // Add seq number
        this.addSeqNumber(payload);
        // Publish
        logger.info("Publishing DBIRTH for device " + deviceId);
        let p = this.maybeCompressPayload(payload, options);
        this.client.publish(topic, Buffer.from(this.encodePayload(p)));
        this.messageAlert("published", topic, p);
    }
    // Publishes Node BIRTH certificates for the edge node
    publishDeviceDeath(deviceId, payload) {
        let topic = this.version + "/" + this.groupId + "/DDEATH/" + this.edgeNode + "/" + deviceId, options = {};
        // Add seq number
        this.addSeqNumber(payload);
        // Publish
        logger.info("Publishing DDEATH for device " + deviceId);
        this.client.publish(topic, Buffer.from(this.encodePayload(this.maybeCompressPayload(payload, options))));
        this.messageAlert("published", topic, payload);
    }
    // Publishes Node Data messages for the edge node
    publishNodeCommand(groupId, nodeId, payload, options) {
        let topic = this.version + "/" + groupId + "/NCMD/" + nodeId;
        // Add seq number
        this.addSeqNumber(payload);
        // Publish
        logger.info("Publishing NCMD");
        this.client.publish(topic, Buffer.from(this.encodePayload(this.maybeCompressPayload(payload, options))));
        this.messageAlert("published", topic, payload);
    }
    // Publishes Node Data messages for the edge node
    publishDeviceCommand(groupId, nodeId, deviceId, payload, options) {
        let topic = this.version + "/" + groupId + "/DCMD/" + nodeId + "/" + deviceId;
        // Add seq number
        this.addSeqNumber(payload);
        // Publish
        logger.info("Publishing DCMD");
        this.client.publish(topic, Buffer.from(this.encodePayload(this.maybeCompressPayload(payload, options))));
        this.messageAlert("published", topic, payload);
    }
    stop() {
        logger.debug("publishDeath: " + this.publishDeath);
        if (this.publishDeath) {
            // Publish the DEATH certificate
            this.publishNDeath(this.client);
        }
        this.client.end();
    }
    // Configures and connects the client
    init() {
        // Connect to the MQTT server
        this.connecting = true;
        logger.debug("Attempting to connect: " + this.serverUrl);
        logger.debug("              options: " + JSON.stringify(this.mqttOptions));
        this.client = mqtt.connect(this.serverUrl, this.mqttOptions);
        logger.debug("Finished attempting to connect");
        /*
         * 'connect' handler
         */
        this.client.on('connect', () => {
            logger.info("Client has connected");
            this.connecting = false;
            this.connected = true;
            this.emit("connect");
            // Subscribe to control/command messages for both the edge node and the attached devices
            logger.info("Subscribing to control/command messages for both the edge node and the attached devices");
            this.client.subscribe(this.version + "/" + this.groupId + "/NCMD/" + this.edgeNode + "/#", { "qos": 0 });
            this.client.subscribe(this.version + "/" + this.groupId + "/DCMD/" + this.edgeNode + "/#", { "qos": 0 });
            // Subscribe to state messages
            this.client.subscribe('STATE/#', { qos: 1 });
            // Emit the "birth" event to notify the application to send a births
            this.emit("birth");
        });
        /*
         * 'error' handler
         */
        this.client.on('error', (error) => {
            if (this.connecting) {
                this.emit("error", error);
                this.client.end();
            }
        });
        /*
         * 'close' handler
         */
        this.client.on('close', () => {
            if (this.connected) {
                this.connected = false;
                this.emit("close");
            }
        });
        /*
         * 'reconnect' handler
         */
        this.client.on("reconnect", () => {
            this.emit("reconnect");
        });
        /*
         * 'reconnect' handler
         */
        this.client.on("offline", () => {
            this.emit("offline");
        });
        /*
         * 'packetsend' handler
         */
        this.client.on("packetsend", (packet) => {
            logger.debug("packetsend: " + packet.cmd);
        });
        /*
         * 'packetreceive' handler
         */
        this.client.on("packetreceive", (packet) => {
            logger.debug("packetreceive: " + packet.cmd);
        });
        /*
         * 'message' handler
         */
        this.client.on('message', (topic, message) => {
            let payload, timestamp, splitTopic, metrics;
            splitTopic = topic.split("/");
            if (splitTopic[0] === this.version) {
                payload = this.maybeDecompressPayload(this.decodePayload(message));
                timestamp = payload.timestamp;
                if (splitTopic[0] === this.version
                    && splitTopic[1] === this.groupId
                    && splitTopic[2] === "NCMD"
                    && splitTopic[3] === this.edgeNode) {
                    // Emit the "command" event
                    this.emit("ncmd", payload);
                }
                else if (splitTopic[0] === this.version
                    && splitTopic[1] === this.groupId
                    && splitTopic[2] === "DCMD"
                    && splitTopic[3] === this.edgeNode) {
                    // Emit the "command" event for the given deviceId
                    this.emit("dcmd", splitTopic[4], payload);
                }
            }
            else {
                payload = message;
                this.emit("message", topic, payload);
            }
            this.messageAlert("arrived", topic, payload);
        });
    }
}
function newClient(config) {
    return new SparkplugClient(config);
}
exports.newClient = newClient;
/*
 * Sparkplug Host
 */
class SparkplugHost extends events_1.default.EventEmitter {
    // Constants
    type_int32 = 7;
    type_boolean = 11;
    type_string = 12;
    versionB = "spBv1.0";
    // Config Variables
    serverUrl;
    version;
    primaryHostId;
    mqttOptions;
    // MQTT Client Variables
    bdSeq = 0;
    seq = 0;
    client = null;
    connecting = false;
    connected = false;
    constructor(config) {
        super();
        this.version = getProperty(config, "version", this.versionB);
        // Client connection options
        this.serverUrl = getRequiredProperty(config, "serverUrl");
        this.primaryHostId = getRequiredProperty(config, 'primaryHostId');
        const username = getRequiredProperty(config, "username");
        const password = getRequiredProperty(config, "password");
        const keepalive = getProperty(config, "keepalive", 5);
        const clientId = getRequiredProperty(config, "clientId");
        this.mqttOptions = {
            ...config.mqttOptions || {}, // allow additional options
            clean: true,
            clientId,
            keepalive,
            reschedulePings: false,
            connectTimeout: 30000,
            username,
            password,
            will: {
                topic: `STprimaryHostIdATE/${this.primaryHostId}`,
                payload: `OFFLINE`,
                qos: 0,
                retain: true,
            },
        };
        this.init();
    }
    // Increments a sequence number
    incrementSeqNum() {
        if (this.seq == 256) {
            this.seq = 0;
        }
        return this.seq++;
    }
    encodePayload(payload) {
        return sparkplugbpayload.encodePayload(payload);
    }
    ;
    decodePayload(payload) {
        return sparkplugbpayload.decodePayload(payload);
    }
    addSeqNumber(payload) {
        payload.seq = this.incrementSeqNum();
    }
    // Get DEATH payload
    getDeathPayload() {
        return {
            "timestamp": new Date().getTime(),
            "metrics": [{
                    "name": "bdSeq",
                    "value": this.bdSeq,
                    "type": "uint64"
                }]
        };
    }
    // Logs a message alert to the console
    messageAlert(alert, topic, payload) {
        logger.debug("Message " + alert);
        logger.debug(" topic: " + topic);
        logger.debug(" payload: " + JSON.stringify(payload));
    }
    compressPayload(payload, options) {
        let algorithm = null, compressedPayload, resultPayload = {
            "uuid": compressed,
            "metrics": []
        };
        logger.debug("Compressing payload " + JSON.stringify(options));
        // See if any options have been set
        if (options !== undefined && options !== null) {
            // Check algorithm
            if (options['algorithm']) {
                algorithm = options['algorithm'];
            }
        }
        if (algorithm === null || algorithm.toUpperCase() === "DEFLATE") {
            logger.debug("Compressing with DEFLATE!");
            resultPayload.body = pako_1.default.deflate(payload);
        }
        else if (algorithm.toUpperCase() === "GZIP") {
            logger.debug("Compressing with GZIP");
            resultPayload.body = pako_1.default.gzip(payload);
        }
        else {
            throw new Error("Unknown or unsupported algorithm " + algorithm);
        }
        // Create and add the algorithm metric if is has been specified in the options
        if (algorithm !== null) {
            resultPayload.metrics = [{
                    "name": "algorithm",
                    "value": algorithm.toUpperCase(),
                    "type": "String"
                }];
        }
        return resultPayload;
    }
    decompressPayload(payload) {
        let metrics = payload.metrics || [], algorithm = null;
        const body = payload.body || new Uint8Array();
        logger.debug("Decompressing payload");
        const algorithmMetric = metrics.find(m => m.name === 'algorithm');
        if (algorithmMetric && typeof algorithmMetric.value === 'string') {
            algorithm = algorithmMetric.value;
        }
        if (algorithm === null || algorithm.toUpperCase() === "DEFLATE") {
            logger.debug("Decompressing with DEFLATE!");
            return pako_1.default.inflate(body);
        }
        else if (algorithm.toUpperCase() === "GZIP") {
            logger.debug("Decompressing with GZIP");
            return pako_1.default.ungzip(body);
        }
        else {
            throw new Error("Unknown or unsupported algorithm " + algorithm);
        }
    }
    maybeCompressPayload(payload, options) {
        if (options?.compress) {
            // Compress the payload
            return this.compressPayload(this.encodePayload(payload), options);
        }
        else {
            // Don't compress the payload
            return payload;
        }
    }
    maybeDecompressPayload(payload) {
        if (payload.uuid !== undefined && payload.uuid === compressed) {
            // Decompress the payload
            return this.decodePayload(this.decompressPayload(payload));
        }
        else {
            // The payload is not compressed
            return payload;
        }
    }
    subscribeTopic(topic, options = { "qos": 0 }, callback) {
        logger.info("Subscribing to topic:", topic);
        this.client.subscribe(topic, options, callback);
    }
    unsubscribeTopic(topic, options, callback) {
        logger.info("Unsubscribing topic:", topic);
        this.client.unsubscribe(topic, options, callback);
    }
    publishHostOnline() {
        const topic = `STATE/${this.primaryHostId}`;
        const payload = 'ONLINE';
        logger.info('Publishing Primary Host Online.');
        this.client?.publish(topic, payload, { retain: true });
        this.messageAlert('published', topic, payload);
    }
    publishHostOffline() {
        const topic = `STATE/${this.primaryHostId}`;
        const payload = 'OFFLINE';
        logger.info('Publish Primary Host Offline.');
        this.client?.publish(topic, payload, { retain: true });
        this.messageAlert('published', topic, payload);
    }
    // Publishes Node Data messages for the edge node
    publishNodeCommand(groupId, nodeId, payload, options) {
        let topic = this.version + "/" + groupId + "/NCMD/" + nodeId;
        // Add seq number
        this.addSeqNumber(payload);
        // Publish
        logger.info("Publishing NCMD");
        this.client.publish(topic, Buffer.from(this.encodePayload(this.maybeCompressPayload(payload, options))));
        this.messageAlert("published", topic, payload);
    }
    // Publishes Node Data messages for the edge node
    publishDeviceCommand(groupId, nodeId, deviceId, payload, options) {
        let topic = this.version + "/" + groupId + "/DCMD/" + nodeId + "/" + deviceId;
        // Add seq number
        this.addSeqNumber(payload);
        // Publish
        logger.info("Publishing DCMD");
        this.client.publish(topic, Buffer.from(this.encodePayload(this.maybeCompressPayload(payload, options))));
        this.messageAlert("published", topic, payload);
    }
    stop() {
        this.publishHostOffline();
        this.client?.end();
    }
    // Configures and connects the client
    init() {
        // Connect to the MQTT server
        this.connecting = true;
        logger.debug("Attempting to connect: " + this.serverUrl);
        logger.debug("              options: " + JSON.stringify(this.mqttOptions));
        this.client = mqtt.connect(this.serverUrl, this.mqttOptions);
        logger.debug("Finished attempting to connect");
        /*
         * 'connect' handler
         */
        this.client.on('connect', () => {
            logger.info("Client has connected");
            this.connecting = false;
            this.connected = true;
            this.emit("connect");
            // Subscribe to control/command messages for both the edge node and the attached devices
            logger.info("Subscribing to control/command messages for both the edge node and the attached devices");
            // Subscribe to state messages
            this.client.subscribe(`${this.version}/#`, { qos: 1 });
            // Emit the "birth" event to notify the application to send a births
            this.emit("birth");
        });
        /*
         * 'error' handler
         */
        this.client.on('error', (error) => {
            if (this.connecting) {
                this.emit("error", error);
                this.client.end();
            }
        });
        /*
         * 'close' handler
         */
        this.client.on('close', () => {
            if (this.connected) {
                this.connected = false;
                this.emit("close");
            }
        });
        /*
         * 'reconnect' handler
         */
        this.client.on("reconnect", () => {
            this.emit("reconnect");
        });
        /*
         * 'reconnect' handler
         */
        this.client.on("offline", () => {
            this.emit("offline");
        });
        /*
         * 'packetsend' handler
         */
        this.client.on("packetsend", (packet) => {
            logger.debug("packetsend: " + packet.cmd);
        });
        /*
         * 'packetreceive' handler
         */
        this.client.on("packetreceive", (packet) => {
            logger.debug("packetreceive: " + packet.cmd);
        });
        /*
         * 'message' handler
         */
        this.client.on('message', (topic, message) => {
            let payload, timestamp, splitTopic, metrics;
            splitTopic = topic.split("/");
            if (splitTopic[0] === this.version) {
                try {
                    payload = this.maybeDecompressPayload(this.decodePayload(message));
                }
                catch {
                    payload = message;
                }
                timestamp = payload.timestamp;
                if (splitTopic[0] === this.version && splitTopic[2] === 'DDATA') {
                    this.emit('ddata', topic, splitTopic[1], //groupId
                    splitTopic[3], //nodeId
                    splitTopic[4], //deviceId
                    payload);
                }
                else if (splitTopic[0] === this.version && splitTopic[2] === 'NBIRTH') {
                    this.emit('nbirth', topic, splitTopic[1], //groupdId
                    splitTopic[3], //nodeId
                    payload);
                }
                else if (splitTopic[0] === this.version && splitTopic[2] === 'DBIRTH') {
                    this.emit('dbirth', topic, splitTopic[1], //groupId
                    splitTopic[3], //nodeId
                    splitTopic[4], //deviceId
                    payload);
                }
                else if (splitTopic[0] === this.version && splitTopic[2] === 'NDEATH') {
                    this.emit('ndeath', topic, splitTopic[1], //groupId
                    splitTopic[3], //nodeId
                    payload);
                }
                else if (splitTopic[0] === this.version && splitTopic[2] === 'DDEATH') {
                    this.emit('ddeath', topic, splitTopic[1], //groupId
                    splitTopic[3], //nodeId
                    splitTopic[4], //deviceId
                    payload);
                }
                else if (splitTopic[0] === this.version && splitTopic[2] === "NCMD") {
                    // Emit the "command" event
                    this.emit("ncmd", payload);
                }
                else if (splitTopic[0] === this.version && splitTopic[2] === "DCMD") {
                    // Emit the "command" event for the given deviceId
                    this.emit("dcmd", splitTopic[4], payload);
                }
            }
            else {
                payload = message;
                // Split the topic up into tokens
                if (splitTopic[0] === 'STATE') {
                    this.emit("state", splitTopic[1], payload);
                }
                else {
                    this.emit("message", topic, payload);
                }
            }
            this.messageAlert("arrived", topic, payload);
        });
    }
}
function newHost(config) {
    return new SparkplugHost(config);
}
exports.newHost = newHost;
