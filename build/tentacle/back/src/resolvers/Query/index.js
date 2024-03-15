"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tPlc = exports.changes = exports.tClasses = exports.tClass = exports.programs = exports.program = exports.variables = exports.values = exports.value = exports.configuration = exports.metrics = exports.info = void 0;
const denormalize_1 = require("../../denormalize");
const plc_1 = require("../../plc");
const lodash_1 = __importDefault(require("lodash"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const recursiveReaddr_1 = require("../../recursiveReaddr");
function info() {
    return 'Tentacle: A modern soft PLC';
}
exports.info = info;
function metrics() {
    return Object.keys(plc_1.plc.metrics).map((key) => {
        return {
            task: key,
            ...plc_1.plc.metrics[key],
        };
    });
}
exports.metrics = metrics;
function configuration() {
    return {
        tasks: Object.keys(plc_1.plc.config.tasks).map((key) => {
            return {
                name: key,
                description: plc_1.plc?.config?.tasks[key]?.description !== null && plc_1.plc?.config?.tasks[key]?.description !== undefined
                    ? plc_1.plc.config.tasks[key].description
                    : '',
                ...plc_1.plc.config.tasks[key],
            };
        }),
        mqtt: Object.keys(plc_1.plc.config.mqtt).map((key) => {
            return {
                name: key,
                description: plc_1.plc?.config?.mqtt[key]?.description !== null && plc_1.plc?.config?.mqtt[key]?.description !== undefined
                    ? plc_1.plc.config.mqtt[key].description
                    : '',
                ...plc_1.plc.config.mqtt[key],
            };
        }),
        modbus: Object.keys(plc_1.plc.config.modbus).map((key) => {
            return {
                name: key,
                description: plc_1.plc.config.modbus[key].description !== null && plc_1.plc?.config?.modbus[key]?.description !== undefined
                    ? plc_1.plc.config.modbus[key].description
                    : '',
                ...plc_1.plc.config.modbus[key],
            };
        }),
        opcua: Object.keys(plc_1.plc.config.opcua).map((key) => {
            return {
                name: key,
                description: plc_1.plc.config.opcua[key].description !== null && plc_1.plc?.config?.opcua[key]?.description !== undefined
                    ? plc_1.plc.config.opcua[key].description
                    : '',
                ...plc_1.plc.config.opcua[key],
            };
        }),
    };
}
exports.configuration = configuration;
function value(root, args) {
    const variable = lodash_1.default.get(plc_1.plc.global, args.variablePath);
    if (variable !== undefined) {
        return {
            path: args.variablePath,
            value: variable,
            datatype: typeof variable,
        };
    }
    else {
        throw Error(`${args.variablePath} does not exits.`);
    }
}
exports.value = value;
function values() {
    const values = (0, denormalize_1.denormalize)(plc_1.plc.global);
    return Object.keys(values).map((key) => {
        return {
            path: key,
            value: values[key],
            datatype: typeof values[key],
        };
    });
}
exports.values = values;
function variables() {
    return Object.keys(plc_1.plc.variables).map((key) => {
        const atomicDatatypes = ['string', 'boolean', 'number'];
        let children = [];
        if (!atomicDatatypes.includes(plc_1.plc.variables[key].datatype)) {
            const variableClass = plc_1.plc.classes.find((item) => item.name === plc_1.plc.variables[key].datatype);
            children = Object.keys(variableClass.variables).map((childKey) => {
                return {
                    name: childKey,
                    ...variableClass.variables[childKey],
                };
            });
        }
        return {
            name: key,
            description: plc_1.plc?.variables[key]?.description !== null && plc_1.plc?.variables[key]?.description !== undefined
                ? plc_1.plc.variables[key].description
                : '',
            ...plc_1.plc.variables[key],
            children,
        };
    });
}
exports.variables = variables;
function program(_root, args) {
    return fs_1.default.readFileSync(path_1.default.resolve(process.cwd(), 'development/programs', args.name), { encoding: 'utf8', flag: 'r' });
}
exports.program = program;
function programs() {
    const result = (0, recursiveReaddr_1.getAllFiles)(path_1.default.resolve(process.cwd(), 'development/programs')).map((file) => file.replace(`${process.cwd()}/development/programs/`, ''));
    return result;
}
exports.programs = programs;
function tClass(args) {
    return fs_1.default.readFileSync(path_1.default.resolve(process.cwd(), 'development/classes', args.name), { encoding: 'utf8', flag: 'r' });
}
exports.tClass = tClass;
function tClasses() {
    return fs_1.default
        .readdirSync(path_1.default.resolve(process.cwd(), 'development/classes'))
        .map((file) => file.replace(`${process.cwd()}/development/classes/`, ''));
}
exports.tClasses = tClasses;
function changes() {
    return plc_1.plc.fileChanges;
}
exports.changes = changes;
function tPlc() {
    return plc_1.plc;
}
exports.tPlc = tPlc;
