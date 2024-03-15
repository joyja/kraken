"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roster = void 0;
const prisma_1 = require("../prisma");
function roster(parent) {
    if (parent.rosterId !== null && parent.rosterId !== undefined) {
        return prisma_1.prisma.roster.findUnique({ where: { id: parent.rosterId } });
    }
    else {
        return null;
    }
}
exports.roster = roster;
