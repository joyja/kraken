"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.history = exports.chartPages = exports.rosters = exports.users = exports.alarms = exports.groups = exports.info = void 0;
const prisma_1 = require("../../prisma");
const mqtt_1 = require("../../mqtt");
const alarm_1 = require("../../alarm");
const roster_1 = require("../../roster");
const user_1 = require("../../user");
const history_1 = require("../../history");
function info() {
    return 'Sparkplug B Historian and Alarm Notifier';
}
exports.info = info;
function groups(_root, args) {
    return mqtt_1.spdata.groups;
}
exports.groups = groups;
function alarms() {
    return alarm_1.alarmHandler.getAll();
}
exports.alarms = alarms;
function users() {
    return user_1.userHandler.getAll();
}
exports.users = users;
function rosters() {
    return roster_1.rosterHandler.getAll();
}
exports.rosters = rosters;
async function chartPages() {
    return prisma_1.prisma.chartPage.findMany({
        include: { charts: { include: { pens: true } } }
    });
}
exports.chartPages = chartPages;
async function history(_root, args) {
    const history = new history_1.History(prisma_1.prisma);
    const { metrics, start, end, interval, samples, raw } = args.input;
    return history.getHistoryBucketed({
        metrics,
        start,
        end,
        interval,
        samples,
        raw
    });
}
exports.history = history;
