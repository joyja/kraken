"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groups = exports.info = void 0;
const mqtt_1 = require("../../mqtt");
function info() { return 'Data Acquisition and visualation for tentacle-edge devices.'; }
exports.info = info;
function groups() {
    return mqtt_1.spdata.groups;
}
exports.groups = groups;
