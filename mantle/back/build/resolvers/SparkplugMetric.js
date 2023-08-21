"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.history = void 0;
const mqtt_1 = require("../mqtt");
const addMinutes_1 = __importDefault(require("date-fns/addMinutes"));
function history(parent) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const end = new Date();
        const start = (0, addMinutes_1.default)(end, -15);
        const history = yield ((_a = mqtt_1.spdata.history) === null || _a === void 0 ? void 0 : _a.getHistory({ metric: parent, start, end }));
        return history === null || history === void 0 ? void 0 : history.map((row) => {
            return {
                timestamp: row.timestamp,
                value: `${row.int_value || row.float_value || row.string_value || row.bool_value}`
            };
        });
    });
}
exports.history = history;
