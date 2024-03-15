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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.acknowledgeRoster = exports.moveDownRosterEntry = exports.moveUpRosterEntry = exports.deleteRosterEntry = exports.updateRosterEntry = exports.createRosterEntry = exports.deleteRoster = exports.updateRoster = exports.createRoster = exports.deleteUser = exports.updateUser = exports.createUser = exports.acknowledgeAlarm = exports.deleteAlarm = exports.updateAlarm = exports.createAlarm = exports.sendDeviceCommand = exports.sendNodeCommand = void 0;
const mqtt_1 = require("../../mqtt");
const alarm_1 = require("../../alarm");
const user_1 = require("../../user");
const roster_1 = require("../../roster");
// import { Log } from '../../log';
__exportStar(require("./chart"), exports);
// const log = new Log('Mutations');
async function sendNodeCommand(root, { groupId, nodeId, command
// value
 }) {
    await mqtt_1.spdata.sendNodeCommand({
        groupId,
        nodeId,
        metricId: `Node Control/${command}`,
        value: true
    });
    return true;
}
exports.sendNodeCommand = sendNodeCommand;
async function sendDeviceCommand(root, { groupId, nodeId, deviceId, command, value }) {
    mqtt_1.spdata.sendDeviceCommand({
        groupId,
        nodeId,
        deviceId,
        metricId: `Device Control/${command}`,
        value
    });
    return true;
}
exports.sendDeviceCommand = sendDeviceCommand;
async function createAlarm(root, { input }) {
    return alarm_1.alarmHandler.create({ input });
}
exports.createAlarm = createAlarm;
async function updateAlarm(root, { input }) {
    return alarm_1.alarmHandler.update({ input });
}
exports.updateAlarm = updateAlarm;
async function deleteAlarm(root, { input }) {
    return alarm_1.alarmHandler.delete(input.id);
}
exports.deleteAlarm = deleteAlarm;
async function acknowledgeAlarm(root, { id }) {
    return alarm_1.alarmHandler.acknowledge(id);
}
exports.acknowledgeAlarm = acknowledgeAlarm;
async function createUser(root, { input }) {
    return user_1.userHandler.create({ input });
}
exports.createUser = createUser;
async function updateUser(root, { input }) {
    return user_1.userHandler.update({ input });
}
exports.updateUser = updateUser;
async function deleteUser(root, { input }) {
    return user_1.userHandler.delete(input.id);
}
exports.deleteUser = deleteUser;
async function createRoster(root, { input }) {
    return roster_1.rosterHandler.create({ input });
}
exports.createRoster = createRoster;
async function updateRoster(root, { input }) {
    return roster_1.rosterHandler.update({ input });
}
exports.updateRoster = updateRoster;
async function deleteRoster(root, { input }) {
    return roster_1.rosterHandler.delete(input.id);
}
exports.deleteRoster = deleteRoster;
async function createRosterEntry(root, { input }) {
    return roster_1.rosterHandler.createEntry({ input });
}
exports.createRosterEntry = createRosterEntry;
async function updateRosterEntry(root, { input }) {
    return roster_1.rosterHandler.updateEntry({ input });
}
exports.updateRosterEntry = updateRosterEntry;
async function deleteRosterEntry(root, { input }) {
    return roster_1.rosterHandler.deleteEntry(input.id);
}
exports.deleteRosterEntry = deleteRosterEntry;
async function moveUpRosterEntry(root, { input }) {
    return roster_1.rosterHandler.moveUpEntry(input.id);
}
exports.moveUpRosterEntry = moveUpRosterEntry;
async function moveDownRosterEntry(root, { input }) {
    return roster_1.rosterHandler.moveDownEntry(input.id);
}
exports.moveDownRosterEntry = moveDownRosterEntry;
async function acknowledgeRoster(root, { id }) {
    return roster_1.rosterHandler.acknowledge(id);
}
exports.acknowledgeRoster = acknowledgeRoster;
