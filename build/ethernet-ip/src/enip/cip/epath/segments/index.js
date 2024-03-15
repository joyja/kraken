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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATA = exports.LOGICAL = exports.PORT = exports.SegmentTypes = void 0;
const PORT = __importStar(require("./port"));
exports.PORT = PORT;
const LOGICAL = __importStar(require("./logical"));
exports.LOGICAL = LOGICAL;
const DATA = __importStar(require("./data"));
exports.DATA = DATA;
const SegmentTypes = {
    PORT: 0 << 5, // Communication Port to Leave Node (Shall be 1 for a Backplane), Link Address of Next Device
    LOGICAL: 1 << 5,
    NETWORK: 2 << 5,
    SYMBOLIC: 3 << 5,
    DATA: 4 << 5,
    DATATYPE_1: 5 << 5,
    DATATYPE_2: 6 << 6
};
exports.SegmentTypes = SegmentTypes;
