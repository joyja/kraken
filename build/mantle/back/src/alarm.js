"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alarmHandler = void 0;
const prisma_1 = require("./prisma");
const types_1 = require("./resolvers/types");
const log_1 = require("./log");
const log = new log_1.Log('Alarm');
function parseAlarmCondition(data) {
    if (!data) {
        return null;
    }
    const isBooleanOutput = (value) => typeof value === 'boolean';
    const isFloatOutput = (value) => typeof value === 'number';
    const isValidMode = (value) => Object.values(types_1.AlarmConditionMode).includes(value);
    if (isValidMode(data.mode)) {
        const parsed = {
            __typename: data.__typename === 'AlarmCondition' ? data.__typename : undefined,
            mode: data.mode
        };
        if (data.inclusive !== undefined && isBooleanOutput(data.inclusive)) {
            parsed.inclusive = data.inclusive;
        }
        if (data.inclusiveHigh !== undefined && isBooleanOutput(data.inclusiveHigh)) {
            parsed.inclusiveHigh = data.inclusiveHigh;
        }
        if (data.inclusiveLow !== undefined && isBooleanOutput(data.inclusiveLow)) {
            parsed.inclusiveLow = data.inclusiveLow;
        }
        if (data.setpoint !== undefined && isFloatOutput(data.setpoint)) {
            parsed.setpoint = data.setpoint;
        }
        if (data.setpointHigh !== undefined && isFloatOutput(data.setpointHigh)) {
            parsed.setpointHigh = data.setpointHigh;
        }
        if (data.setpointLow !== undefined && isFloatOutput(data.setpointLow)) {
            parsed.setpointLow = data.setpointLow;
        }
        return parsed;
    }
    return null;
}
function prismaToResolver(prismaAlarm) {
    const condition = parseAlarmCondition(prismaAlarm.condition);
    if (condition) {
        // @ts-ignore
        return {
            ...prismaAlarm,
            condition
        };
    }
    else {
        throw Error(`Failed to parse condition for alarm ${prismaAlarm.id}`);
    }
}
function evaluate(alarm, metric) {
    const condition = parseAlarmCondition(alarm.condition);
    const value = metric.value?.toString() ? parseFloat(metric.value?.toString()) : metric.value;
    if (condition) {
        if (condition.mode === 'EQUAL') {
            return value === condition.setpoint;
        }
        else if (condition.mode === 'NOT_EQUAL') {
            return value !== condition.setpoint;
        }
        else if (condition.mode === 'ABOVE_SETPOINT') {
            if (typeof value === 'number') {
                return condition.inclusive ? value >= condition.setpoint : value > condition.setpoint;
            }
            else {
                throw Error('Cannot evaluate Above Setpoint condition on non-numeric value');
            }
        }
        else if (condition.mode === 'BELOW_SETPOINT') {
            if (typeof value === 'number') {
                return condition.inclusive ? value <= condition.setpoint : value < condition.setpoint;
            }
            else {
                throw Error('Cannot evaluate Below Setpoint condition on non-numeric value');
            }
        }
        else if (condition.mode === 'BETWEEN_SETPOINTS') {
            if (typeof value === 'number') {
                const low = condition.inclusiveLow
                    ? value <= condition.setpointLow
                    : value < condition.setpointLow;
                const high = condition.inclusiveHigh
                    ? value >= condition.setpointHigh
                    : value > condition.setpointHigh;
                return !low && !high;
            }
            else {
                throw Error('Cannot evaluate Between Setpoints condition on non-numeric value');
            }
        }
        else if (condition.mode === 'OUTSIDE_SETPOINTS') {
            if (typeof value === 'number') {
                const low = condition.inclusiveLow
                    ? value <= condition.setpointLow
                    : value < condition.setpointLow;
                const high = condition.inclusiveHigh
                    ? value >= condition.setpointHigh
                    : value > condition.setpointHigh;
                return low || high;
            }
            else {
                throw Error('Cannot evaluate Outside Setpoints condition on non-numeric value');
            }
        }
        else {
            throw Error('Unknown condition mode');
        }
    }
}
async function historize(alarm, active) {
    return await prisma_1.prisma.alarmHistory.create({
        data: {
            alarmId: alarm.id,
            timestamp: new Date(),
            active,
            acknowledged: alarm.acknowledged
        }
    });
}
class AlarmHandler {
    create({ input }) {
        return prisma_1.prisma.alarm.create({ data: input }).then(prismaToResolver);
    }
    update({ input }) {
        const { id, ...updateFields } = input;
        const data = {};
        // Filter out null values
        Object.keys(updateFields).forEach((key) => {
            if (updateFields[key])
                data[key] = updateFields[key];
        });
        return prisma_1.prisma.alarm.update({ where: { id }, data }).then(prismaToResolver);
    }
    delete(id) {
        return prisma_1.prisma.alarm.delete({ where: { id } }).then(prismaToResolver);
    }
    getAll() {
        return prisma_1.prisma.alarm
            .findMany()
            .then((alarms) => alarms.map(prismaToResolver).sort((a, b) => a.name.localeCompare(b.name)));
    }
    getActive() {
        return prisma_1.prisma.alarm
            .findMany({ where: { active: true }, include: { roster: true } })
            .then((alarms) => alarms.map(prismaToResolver));
    }
    getUnack() {
        return prisma_1.prisma.alarm
            .findMany({ where: { acknowledged: false }, include: { roster: true } })
            .then((alarms) => alarms.map(prismaToResolver));
    }
    getOne(id) {
        return prisma_1.prisma.alarm.findUnique({ where: { id } }).then((alarm) => {
            if (alarm) {
                prismaToResolver(alarm);
            }
            else {
                throw Error(`Alarm with id ${id} not found`);
            }
        });
    }
    async acknowledge(id) {
        const alarm = await prisma_1.prisma.alarm.findUnique({ where: { id } });
        if (alarm) {
            if (!alarm.acknowledged) {
                const updated = await prisma_1.prisma.alarm.update({
                    where: { id: alarm.id },
                    data: { acknowledged: true }
                });
                await historize(updated, true);
                return prismaToResolver(updated);
            }
            else {
                return prismaToResolver(alarm);
            }
        }
        else {
            throw Error(`Alarm with id ${id} not found`);
        }
    }
    async evaluateMetricAlarms(metric) {
        const alarms = await prisma_1.prisma.alarm.findMany({
            where: {
                groupId: metric.groupId,
                nodeId: metric.nodeId,
                deviceId: metric.deviceId,
                metricId: metric.id
            }
        });
        await Promise.all(alarms.map(async (alarm) => {
            const result = evaluate(alarm, metric);
            if (result && !alarm.active) {
                log.info(`Alarm ${alarm.id}:${alarm.name} active`);
                await prisma_1.prisma.alarm.update({
                    where: { id: alarm.id },
                    data: { active: true, acknowledged: false }
                });
                historize(alarm, true);
            }
            else if (!result && alarm.active) {
                log.info(`Alarm ${alarm.id}:${alarm.name} cleared`);
                await prisma_1.prisma.alarm.update({
                    where: { id: alarm.id },
                    data: { active: false }
                });
                historize(alarm, false);
            }
        }));
        return alarms;
    }
}
exports.alarmHandler = new AlarmHandler();
