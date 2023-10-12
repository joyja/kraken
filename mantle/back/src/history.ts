import { PrismaClient, Prisma } from '@prisma/client'
import { SparkplugMetric } from './mqtt'
import { Log } from './log'

const log = new Log('history')

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
}