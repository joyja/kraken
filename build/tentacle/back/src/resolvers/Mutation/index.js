"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restartPlc = exports.stopPlc = exports.startPlc = exports.runFunction = exports.setValue = void 0;
const plc_1 = require("../../plc");
const lodash_1 = __importDefault(require("lodash"));
function setValue(root, args) {
    const variable = lodash_1.default.get(plc_1.plc.global, args.variablePath);
    if (variable !== undefined) {
        if (typeof variable === 'boolean') {
            lodash_1.default.set(plc_1.plc.global, args.variablePath, args.value === 'true');
        }
        return {
            path: args.variablePath,
            value: args.value,
            datatype: typeof variable,
        };
    }
    else {
        throw Error(`${args.variablePath} does not exits.`);
    }
}
exports.setValue = setValue;
function runFunction(args) {
    const func = lodash_1.default.get(plc_1.plc.global, args.functionPath);
    if (func !== undefined) {
        if (typeof func === 'function') {
            const functionPathParts = args.functionPath.split('.');
            const functionName = functionPathParts.pop();
            const parent = lodash_1.default.get(plc_1.plc.global, functionPathParts.join('.'));
            if (func.length === 0 && (functionName !== null && functionName !== undefined)) {
                parent[functionName]();
            }
            else if (functionName !== null && functionName !== undefined) {
                parent[functionName](...args.args);
            }
        }
        else {
            throw Error(`${args.functionPath} exists, but is not a function.`);
        }
    }
    else {
        throw Error(`${args.functionPath} does not exits.`);
    }
}
exports.runFunction = runFunction;
function startPlc() {
    plc_1.plc.start();
    return plc_1.plc;
}
exports.startPlc = startPlc;
function stopPlc() {
    plc_1.plc.stop();
    return plc_1.plc;
}
exports.stopPlc = stopPlc;
function restartPlc() {
    plc_1.plc.restart();
    return plc_1.plc;
}
exports.restartPlc = restartPlc;
