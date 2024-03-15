"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.value = exports.history = void 0;
const mqtt_1 = require("../mqtt");
const addMinutes_1 = __importDefault(require("date-fns/addMinutes"));
async function history(parent) {
    const end = new Date();
    const start = (0, addMinutes_1.default)(end, -15);
    const history = await mqtt_1.spdata.history?.getHistory({
        metric: parent,
        start,
        end
    });
    return history?.map((row) => {
        return {
            timestamp: row.timestamp,
            value: `${row.intValue || row.floatValue || row.stringValue || row.boolValue}`
        };
    });
}
exports.history = history;
function value(parent) {
    return parent.value?.toString ? parent.value.toString() : parent.value;
}
exports.value = value;
