"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rosterHandler = void 0;
const prisma_1 = require("./prisma");
const alarm_1 = require("./alarm");
// import { Log } from './log';
// const log = new Log('Roster');
function prismaToResolver(prismaRoster) {
    return prismaRoster;
}
class RosterHandler {
    create({ input }) {
        return prisma_1.prisma.roster
            .create({ data: input, include: { users: true, alarms: true } })
            .then(prismaToResolver);
    }
    update({ input }) {
        const { id, ...updateFields } = input;
        const data = {};
        // Filter out null values
        Object.keys(updateFields).forEach((key) => {
            if (updateFields[key] !== null && updateFields[key] !== undefined)
                data[key] = updateFields[key];
        });
        return prisma_1.prisma.roster
            .update({
            where: { id },
            data,
            include: { users: { orderBy: { order: 'asc' } }, alarms: true }
        })
            .then(prismaToResolver);
    }
    delete(id) {
        return prisma_1.prisma.roster
            .delete({
            where: { id },
            include: { users: { orderBy: { order: 'asc' } }, alarms: true }
        })
            .then(prismaToResolver);
    }
    getAll() {
        return prisma_1.prisma.roster
            .findMany({
            include: { users: { orderBy: { order: 'asc' } }, alarms: true }
        })
            .then((users) => users.map(prismaToResolver));
    }
    getOne(id) {
        return prisma_1.prisma.roster
            .findUnique({
            where: { id },
            include: { users: { orderBy: { order: 'asc' } }, alarms: true }
        })
            .then((user) => {
            if (user) {
                prismaToResolver(user);
            }
            else {
                throw Error(`Roster with id ${id} not found`);
            }
        });
    }
    async createEntry({ input }) {
        const rosterId = input.rosterId;
        const entries = await prisma_1.prisma.rosterEntry.findMany({ where: { rosterId } });
        let order = 0;
        if (entries.length > 0) {
            order =
                entries.reduce((acc, entry) => {
                    return acc > entry.order ? acc : entry.order;
                }, 0) + 1;
        }
        return prisma_1.prisma.rosterEntry.create({ data: { ...input, order } });
    }
    async updateEntry({ input }) {
        const { id, ...updateFields } = input;
        const data = {};
        // Filter out null values
        Object.keys(updateFields).forEach((key) => {
            if (updateFields[key] !== null && updateFields[key] !== undefined)
                data[key] = updateFields[key];
        });
        return prisma_1.prisma.rosterEntry.update({ where: { id }, data });
    }
    async deleteEntry(id) {
        const entry = await prisma_1.prisma.rosterEntry.findUnique({ where: { id } });
        if (entry) {
            const entries = await prisma_1.prisma.rosterEntry.findMany({
                where: { rosterId: entry.rosterId }
            });
            const order = entry.order;
            await Promise.all(entries
                .filter((e) => e.order > order)
                .map(async (e) => {
                await prisma_1.prisma.rosterEntry.update({
                    where: { id: e.id },
                    data: { order: e.order - 1 }
                });
            }));
        }
        return prisma_1.prisma.rosterEntry.delete({ where: { id } });
    }
    async moveUpEntry(id) {
        const entry = await prisma_1.prisma.rosterEntry.findUnique({ where: { id } });
        if (entry) {
            const entries = await prisma_1.prisma.rosterEntry.findMany({
                where: { rosterId: entry.rosterId }
            });
            const order = entry.order;
            if (order > 0) {
                const prevEntry = entries.find((e) => e.order === order - 1);
                if (prevEntry) {
                    await prisma_1.prisma.rosterEntry.update({
                        where: { id: prevEntry.id },
                        data: { order }
                    });
                    return prisma_1.prisma.rosterEntry.update({
                        where: { id },
                        data: { order: order - 1 }
                    });
                }
                else {
                    return entry;
                }
            }
            else {
                return entry;
            }
        }
    }
    async moveDownEntry(id) {
        const entry = await prisma_1.prisma.rosterEntry.findUnique({ where: { id } });
        if (entry) {
            const entries = await prisma_1.prisma.rosterEntry.findMany({
                where: { rosterId: entry.rosterId }
            });
            const order = entry.order;
            if (order < entries.length - 1) {
                const nextEntry = entries.find((e) => e.order === order + 1);
                if (nextEntry) {
                    await prisma_1.prisma.rosterEntry.update({
                        where: { id: nextEntry.id },
                        data: { order }
                    });
                    return prisma_1.prisma.rosterEntry.update({
                        where: { id },
                        data: { order: order + 1 }
                    });
                }
                else {
                    return entry;
                }
            }
            else {
                return entry;
            }
        }
    }
    async getActiveRosters() {
        const unack = await alarm_1.alarmHandler.getUnack();
        const rosters = await Promise.all(unack
            .map((alarm) => alarm.roster?.id)
            .filter((roster) => roster !== undefined && roster !== null)
            .map((roster) => prisma_1.prisma.roster.findUnique({
            where: { id: roster },
            include: { users: { orderBy: { order: 'asc' } } }
        })));
        return rosters;
    }
    async acknowledge(id) {
        const roster = await prisma_1.prisma.roster.findUnique({
            where: { id },
            include: { users: { orderBy: { order: 'asc' } }, alarms: true }
        });
        if (roster) {
            await Promise.all(roster.alarms.map((alarm) => {
                alarm_1.alarmHandler.acknowledge(alarm.id);
            }));
        }
        else {
            throw Error(`Roster with id ${id} not found`);
        }
        return roster;
    }
}
exports.rosterHandler = new RosterHandler();
