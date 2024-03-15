"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlarmPriority = exports.AlarmConditionMode = void 0;
var AlarmConditionMode;
(function (AlarmConditionMode) {
    AlarmConditionMode["AboveSetpoint"] = "ABOVE_SETPOINT";
    AlarmConditionMode["BelowSetpoint"] = "BELOW_SETPOINT";
    AlarmConditionMode["BetweenSetpoints"] = "BETWEEN_SETPOINTS";
    AlarmConditionMode["Equal"] = "EQUAL";
    AlarmConditionMode["NotEqual"] = "NOT_EQUAL";
    AlarmConditionMode["OutsideSetpoints"] = "OUTSIDE_SETPOINTS";
})(AlarmConditionMode || (exports.AlarmConditionMode = AlarmConditionMode = {}));
var AlarmPriority;
(function (AlarmPriority) {
    AlarmPriority["Critical"] = "CRITICAL";
    AlarmPriority["High"] = "HIGH";
    AlarmPriority["Low"] = "LOW";
    AlarmPriority["Medium"] = "MEDIUM";
})(AlarmPriority || (exports.AlarmPriority = AlarmPriority = {}));
