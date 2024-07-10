import { prisma } from './prisma.js'
import { AlarmHistory, type Prisma } from '@prisma/client'
import { spdata } from './mqtt.js'
import * as R from 'ramda'
const { gt, lt, equals, not, identity, pipe, prop, pathOr, find, propEq } = R
import {
  AlarmCondition,
  AlarmConditionMode,
  CreateAlarm as ResolverCreateAlarm,
  UpdateAlarm as ResolverUpdateAlarm,
  Alarm as ResolverAlarm,
  Scalars
} from './resolvers/types.js'
import { Alarm as PrismaAlarm } from '@prisma/client'
import { Log } from 'coral'
import { SparkplugMetric } from './mqtt.js'
import { differenceInMilliseconds, subDays } from 'date-fns'

interface MetricSelector {
  groupId: string
  nodeId: string
  deviceId?: string
  metricId: string
}

const getMetric = ({
  metrics,
  groupId,
  nodeId,
  deviceId,
  metricId
}: MetricSelector & { metrics: typeof spdata }):
  | SparkplugMetric
  | undefined => {
  return pipe(
    pathOr([], ['groups']),
    find(propEq(groupId, 'id')),
    pathOr([], ['nodes']),
    find(propEq(nodeId, 'id')),
    pathOr([], ['devices']),
    find(propEq(deviceId, 'id')),
    pathOr([], ['metrics']),
    find(propEq(metricId, 'id'))
  )(metrics) as SparkplugMetric | undefined
}

// Individial alarm state
export interface Problem {
  id: string
  occuredAt: Date
  acknowledgedAt: Date
  description: string
  remediation: string //link telling responder what to do
}

// Returned from AlarmStateEvaluation summary of current alarm state
export interface AlarmStateResult {
  problems: Problem[]
  roster: string[]
}

// User written function that evaluates the state of alarms for the given system
export type AlarmStateEvaluation<T> = (
  metrics: typeof spdata,
  args: T
) => AlarmStateResult

// Example instance of Alarm State Evaluation written/configured by user through gui

const log = new Log('alarm')

function parseAlarmCondition(data: any): AlarmCondition | null {
  if (!data) {
    return null
  }

  const isBooleanOutput = (value: any): value is Scalars['Boolean']['output'] =>
    typeof value === 'boolean'

  const isFloatOutput = (value: any): value is Scalars['Float']['output'] =>
    typeof value === 'number'

  const isValidMode = (value: any): value is AlarmConditionMode =>
    Object.values(AlarmConditionMode).includes(value as AlarmConditionMode)

  if (isValidMode(data.mode)) {
    const parsed: AlarmCondition = {
      __typename:
        data.__typename === 'AlarmCondition' ? data.__typename : undefined,
      mode: data.mode
    }

    if (data.inclusive !== undefined && isBooleanOutput(data.inclusive)) {
      parsed.inclusive = data.inclusive
    }

    if (
      data.inclusiveHigh !== undefined &&
      isBooleanOutput(data.inclusiveHigh)
    ) {
      parsed.inclusiveHigh = data.inclusiveHigh
    }

    if (data.inclusiveLow !== undefined && isBooleanOutput(data.inclusiveLow)) {
      parsed.inclusiveLow = data.inclusiveLow
    }

    if (data.setpoint !== undefined && isFloatOutput(data.setpoint)) {
      parsed.setpoint = data.setpoint
    }

    if (data.setpointHigh !== undefined && isFloatOutput(data.setpointHigh)) {
      parsed.setpointHigh = data.setpointHigh
    }

    if (data.setpointLow !== undefined && isFloatOutput(data.setpointLow)) {
      parsed.setpointLow = data.setpointLow
    }

    return parsed
  }

  return null
}

function prismaToResolver(prismaAlarm: PrismaAlarm): ResolverAlarm {
  const condition = parseAlarmCondition(prismaAlarm.condition)
  if (condition) {
    // @ts-expect-error see explanation below
    // TODO: investigate typescript error
    return {
      ...prismaAlarm,
      condition
    }
  } else {
    throw Error(`Failed to parse condition for alarm ${prismaAlarm.id}`)
  }
}

function evaluate(alarm: PrismaAlarm, metric?: SparkplugMetric) {
  const condition = parseAlarmCondition(alarm.condition)
  const value = metric?.value?.toString()
    ? parseFloat(metric.value?.toString())
    : metric?.value
  if (condition) {
    if (condition.mode === 'EQUAL' && value) {
      return value === condition.setpoint
    } else if (condition.mode === 'NOT_EQUAL') {
      return value !== condition.setpoint
    } else if (condition.mode === 'ABOVE_SETPOINT') {
      if (typeof value === 'number') {
        return condition.inclusive
          ? value >= condition.setpoint!
          : value > condition.setpoint!
      } else {
        throw Error(
          'Cannot evaluate Above Setpoint condition on non-numeric value'
        )
      }
    } else if (condition.mode === 'BELOW_SETPOINT') {
      if (typeof value === 'number') {
        return condition.inclusive
          ? value <= condition.setpoint!
          : value < condition.setpoint!
      } else {
        throw Error(
          'Cannot evaluate Below Setpoint condition on non-numeric value'
        )
      }
    } else if (condition.mode === 'BETWEEN_SETPOINTS' && value) {
      if (typeof value === 'number') {
        const low = condition.inclusiveLow
          ? value <= condition.setpointLow!
          : value < condition.setpointLow!
        const high = condition.inclusiveHigh
          ? value >= condition.setpointHigh!
          : value > condition.setpointHigh!
        return !low && !high
      } else {
        throw Error(
          'Cannot evaluate Between Setpoints condition on non-numeric value'
        )
      }
    } else if (condition.mode === 'OUTSIDE_SETPOINTS' && value) {
      if (typeof value === 'number') {
        const low = condition.inclusiveLow
          ? value <= condition.setpointLow!
          : value < condition.setpointLow!
        const high = condition.inclusiveHigh
          ? value >= condition.setpointHigh!
          : value > condition.setpointHigh!
        return low || high
      } else {
        throw Error(
          'Cannot evaluate Outside Setpoints condition on non-numeric value'
        )
      }
    } else if (condition.mode === 'NO_UPDATE') {
      log.debug(
        `${'NO UPDATE evaluated to:'}${metric?.updatedOn ? differenceInMilliseconds(new Date(), metric?.updatedOn) : false}`
      )
      log.debug(`Setpoint is ${condition.setpoint}`)
      return metric?.updatedOn && condition.setpoint
        ? differenceInMilliseconds(new Date(), metric?.updatedOn) >
            condition.setpoint
        : false
    } else {
      throw Error('Unknown condition mode')
    }
  }
}

async function historize(alarm: PrismaAlarm, active: boolean) {
  return await prisma.alarmHistory.create({
    data: {
      alarmId: alarm.id,
      timestamp: new Date(),
      active,
      acknowledged: alarm.acknowledged
    }
  })
}

class AlarmHandler {
  NoUpdateAlarmsInterval: ReturnType<typeof setInterval>
  constructor() {
    this.NoUpdateAlarmsInterval = setInterval(() => {
      const condition: AlarmConditionMode = AlarmConditionMode.NoUpdate
      this.evaluateMetricAlarms({ condition })
    }, 1000)
  }
  create({ input }: { input: ResolverCreateAlarm }): Promise<ResolverAlarm> {
    return prisma.alarm.create({ data: input }).then(prismaToResolver)
  }
  update({ input }: { input: ResolverUpdateAlarm }): Promise<ResolverAlarm> {
    const { id, ...updateFields }: { id: string; [key: string]: any } = input
    const data: { [key: string]: any } = {}
    // Filter out null values
    Object.keys(updateFields).forEach((key: string) => {
      if (updateFields[key]) data[key] = updateFields[key]
    })
    return prisma.alarm.update({ where: { id }, data }).then(prismaToResolver)
  }
  delete(id: string): Promise<ResolverAlarm> {
    return prisma.alarm.delete({ where: { id } }).then(prismaToResolver)
  }
  getAll(): Promise<ResolverAlarm[]> {
    return prisma.alarm
      .findMany()
      .then((alarms) =>
        alarms
          .map(prismaToResolver)
          .sort((a, b) => a.name.localeCompare(b.name))
      )
  }
  getActive(): Promise<ResolverAlarm[]> {
    return prisma.alarm
      .findMany({ where: { active: true }, include: { roster: true } })
      .then((alarms) => alarms.map(prismaToResolver))
  }
  getUnack(): Promise<ResolverAlarm[]> {
    return prisma.alarm
      .findMany({ where: { acknowledged: false }, include: { roster: true } })
      .then((alarms) => alarms.map(prismaToResolver))
  }
  getOne(id: string): Promise<ResolverAlarm | void> {
    return prisma.alarm.findUnique({ where: { id } }).then((alarm) => {
      if (alarm) {
        prismaToResolver(alarm)
      } else {
        throw Error(`Alarm with id ${id} not found`)
      }
    })
  }
  async acknowledge(id: string): Promise<ResolverAlarm> {
    const alarm = await prisma.alarm.findUnique({ where: { id } })
    if (alarm) {
      if (!alarm.acknowledged) {
        const updated = await prisma.alarm.update({
          where: { id: alarm.id },
          data: { acknowledged: true }
        })
        await historize(updated, true)
        return prismaToResolver(updated)
      } else {
        return prismaToResolver(alarm)
      }
    } else {
      throw Error(`Alarm with id ${id} not found`)
    }
  }
  async evaluateMetricAlarms({
    path,
    condition
  }: {
    path?: {
      groupId: string
      nodeId: string
      deviceId?: string
      metricId: string
    }
    condition?: AlarmConditionMode
  }): Promise<PrismaAlarm[]> {
    let metric: SparkplugMetric | undefined
    if (path != null) {
      const { groupId, nodeId, deviceId, metricId } = path
      metric = spdata.getMetric({
        groupId,
        nodeId,
        deviceId,
        metricId
      })
    }
    const query: Prisma.AlarmFindManyArgs = {
      where: {
        groupId: metric?.groupId,
        nodeId: metric?.nodeId,
        deviceId: metric?.deviceId,
        metricId: metric?.id,
        condition: condition
          ? ({
              path: ['mode'],
              equals: condition
            } as Prisma.JsonFilter<'Alarm'>)
          : undefined
      }
    }
    const alarms = await prisma.alarm.findMany(query)
    await Promise.all(
      alarms.map(async (alarm) => {
        if (metric == null) {
          metric = await spdata.getMetric({
            groupId: alarm.groupId,
            nodeId: alarm.nodeId,
            deviceId: alarm.deviceId,
            metricId: alarm.metricId
          })
        }
        if (metric == null) {
          log.warn(
            `Could not find metric ${alarm.groupId}/${alarm.nodeId}/${alarm.deviceId}/${alarm.metricId} for alarm ${alarm.id}:${alarm.name}.`
          )
          return
        }
        const result = evaluate(alarm, metric)
        if (result && !alarm.active) {
          log.info(`Alarm ${alarm.id}:${alarm.name} active`)
          await prisma.alarm.update({
            where: { id: alarm.id },
            data: { active: true, acknowledged: false }
          })
          historize(alarm, true)
        } else if (!result && alarm.active) {
          log.info(`Alarm ${alarm.id}:${alarm.name} cleared`)
          await prisma.alarm.update({
            where: { id: alarm.id },
            data: { active: false }
          })
          historize(alarm, false)
        }
      })
    )
    return alarms
  }
  history({ start, end }: { start: Date; end: Date }): Promise<AlarmHistory[]> {
    if (start > end) {
      throw Error('start must be before end')
    }
    if (start == null) {
      start = new Date(0)
    }
    if (end == null) {
      end = subDays(new Date(), 30)
    }
    return prisma.alarmHistory
      .findMany({
        where: {
          timestamp: {
            gte: start,
            lte: end
          }
        },
        include: { alarm: true }
      })
      .then((alarms) => alarms)
  }
}

export const alarmHandler = new AlarmHandler()
