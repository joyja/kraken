"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nebulaStatus = void 0;
const nebula_1 = require("../../nebula");
const nebulaStatus = () => {
    return {
        state: nebula_1.nebula.getState(),
    };
};
exports.nebulaStatus = nebulaStatus;
