import { PrismaClient, Prisma } from '@prisma/client'
import { SparkplugMetric } from './mqtt'
import { Log } from './log'
import { differenceInMinutes, subMinutes } from 'date-fns'
import { MetricHistoryEntry } from './resolvers/types'

const log = new Log('history')

interface MetricHistoryAggregate {
  time: Date
  data: {
    [key:string]: number
  }
}

export class History {
  private prisma:PrismaClient
  constructor(prisma:PrismaClient) {
    this.prisma = prisma
  }
  async log(metric:SparkplugMetric) {
    let valueColumn = metric.type.startsWith('Int') ? 'intValue' : metric.type === 'Float' ? 'floatValue' : metric.type === 'String' ? 'stringValue' : metric.type === 'Boolean' ? 'boolValue' : null
    let value = metric.value
    if (valueColumn && value) {
      await this.prisma.history.create({ data: {
        groupId: metric.groupId,
        nodeId: metric.nodeId,
        deviceId: metric.deviceId,
        metricId: metric.id,
        timestamp: metric.updatedOn,
        [valueColumn]: value
      }})
    } else {
      log.info(`Received metric with invalid value (${ JSON.stringify(value,null,2)}) or value type (${ metric.type }), not logging.`)
    }
  }
  async getHistory({ metric, start, end }:{ metric:SparkplugMetric, start:Date, end:Date }) {
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
    })
  }
  async getHistoryBucketed({ metrics, start, end }:{ metrics:MetricHistoryEntry[], start:Date, end:Date}) {
    const interval = `${Math.floor(differenceInMinutes(new Date(end),new Date(start)) * 60.0 / 300.0)} seconds`
    const metricStrings = metrics.map((m) => `('${m.groupId}', '${m.nodeId}', '${m.deviceId}', '${m.metricId}')`)
    const history = await this.prisma.$queryRawUnsafe<MetricHistoryAggregate[]>(`SELECT "time", json_object_agg("name","value") AS data FROM
      (SELECT time_bucket('${interval}', "timestamp") AS "time",
        CONCAT("groupId",'/',"nodeId",'/',"deviceId",'/',"metricId") as "name",
        AVG("floatValue") as "value"
      FROM "History"
      WHERE ("groupId", "nodeId", "deviceId", "metricId") in (${metricStrings}) AND "timestamp" BETWEEN $1 AND $2
      GROUP BY "time", "name"
      ORDER BY "time" ASC) AS bucketed
      GROUP BY "time"
    `,new Date(start), new Date(end))
    const result = metrics.map((m) => {
      return {
        ...m,
        history: history.map((h:any) => {
          return {
            timestamp: h.time,
            value: h.data[`${m.groupId}/${m.nodeId}/${m.deviceId}/${m.metricId}`]
          }
        }).filter((h:any) => h.value !== null && h.value !== undefined)
      }
    })
    return result
  }
}
