"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.History = void 0;
const log_1 = require("./log");
const date_fns_1 = require("date-fns");
const log = new log_1.Log('history');
function isValidTimeBucketInterval(interval) {
    // Regular expression to match the interval pattern
    // This pattern matches strings like "1 day", "2 weeks", "3 months", etc.
    // Adjust the pattern as needed based on your specific interval format requirements
    const pattern = /^\d+\s+(second|minute|hour|day|week|month|year)s?$/i;
    // Test the input against the pattern
    const isValid = pattern.test(interval);
    if (!isValid) {
        return false;
    }
    return true;
}
class History {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(metric) {
        const valueColumn = metric.type.startsWith('Int')
            ? 'intValue'
            : metric.type === 'Float'
                ? 'floatValue'
                : metric.type === 'String'
                    ? 'stringValue'
                    : metric.type === 'Boolean'
                        ? 'boolValue'
                        : null;
        const value = metric.value;
        if (valueColumn && value !== null && value !== undefined) {
            await this.prisma.history.create({
                data: {
                    groupId: metric.groupId,
                    nodeId: metric.nodeId,
                    deviceId: metric.deviceId,
                    metricId: metric.id,
                    timestamp: metric.updatedOn,
                    [valueColumn]: value
                }
            });
        }
        else {
            log.info(`Received metric with invalid value (${JSON.stringify(value, null, 2)}) or value type (${metric.type}), not logging.`);
        }
    }
    async getHistory({ metric, start, end }) {
        return this.prisma.history.findMany({
            where: {
                groupId: metric.groupId,
                nodeId: metric.nodeId,
                deviceId: metric.deviceId,
                metricId: metric.id,
                timestamp: {
                    gte: start,
                    lte: end
                }
            },
            orderBy: {
                timestamp: 'asc'
            }
        });
    }
    async getHistoryBucketed({ metrics, start, end, interval, samples, raw }) {
        if (interval && !isValidTimeBucketInterval(interval)) {
            throw Error('Invalid interval format. Please use a format like "1 day", "2 weeks", etc.');
        }
        //raw superseded interval and samples, but if not raw and both interval and samples are provided, use interval
        const autoInterval = `${Math.floor(((0, date_fns_1.differenceInMinutes)(new Date(end), new Date(start)) * 60.0) / (samples || 300.0))} seconds`;
        const metricStrings = metrics.map((m) => `('${m.groupId}', '${m.nodeId}', '${m.deviceId}', '${m.metricId}')`);
        let selector;
        console.log('interval', interval);
        if (!raw) {
            selector = `(SELECT time_bucket('${interval || autoInterval}', "timestamp") AS "time",
        CONCAT("groupId",'/',"nodeId",'/',"deviceId",'/',"metricId") as "name",
        AVG("floatValue") as "value"`;
        }
        else {
            selector = `(SELECT "timestamp" AS "time",
        CONCAT("groupId",'/',"nodeId",'/',"deviceId",'/',"metricId") as "name",
        AVG("floatValue") as "value"`;
        }
        const history = await this.prisma.$queryRawUnsafe(`SELECT "time", json_object_agg("name","value") AS data FROM
      ${selector}
      FROM "History"
      WHERE ("groupId", "nodeId", "deviceId", "metricId") in (${metricStrings}) AND "timestamp" BETWEEN $1 AND $2
      GROUP BY "time", "name"
      ORDER BY "time" ASC) AS bucketed
      GROUP BY "time"
    `, new Date(start), new Date(end));
        const result = metrics.map((m) => {
            return {
                ...m,
                history: history
                    .map((h) => {
                    return {
                        timestamp: h.time,
                        value: h.data[`${m.groupId}/${m.nodeId}/${m.deviceId}/${m.metricId}`]
                    };
                })
                    .filter((h) => h.value !== null && h.value !== undefined)
            };
        });
        return result;
    }
}
exports.History = History;
