"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.program = void 0;
async function program({ global }) {
    const { count } = global;
    global.count = count + 1;
}
exports.program = program;
