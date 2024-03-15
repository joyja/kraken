"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roster = exports.user = void 0;
const prisma_1 = require("../prisma");
function user(parent) {
    return prisma_1.prisma.user.findUnique({ where: { id: parent.userId } });
}
exports.user = user;
function roster(parent) {
    return prisma_1.prisma.roster.findUnique({ where: { id: parent.rosterId } });
}
exports.roster = roster;
