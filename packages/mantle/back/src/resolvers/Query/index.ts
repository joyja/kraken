import { prisma } from '../../prisma.js'
import { type SparkplugGroup, spdata } from '../../mqtt.js'
import { alarmHandler } from '../../alarm.js'
import {
  type Alarm,
  type HistoryEntry,
  type User,
  type Roster,
  type MetricHistoryEntry,
} from '../types.js'
import { rosterHandler } from '../../roster.js'
import { userHandler } from '../../user.js'
import { History } from '../../history.js'
import { AlarmHistory } from '@prisma/client'

export function info(): string {
  return 'Sparkplug B Historian and Alarm Notifier'
}

export function groups(): SparkplugGroup[] {
  return spdata.groups
}

export async function alarms(): Promise<Alarm[]> {
  return await alarmHandler.getAll()
}

export async function users(): Promise<User[]> {
  return await userHandler.getAll()
}

export async function rosters(): Promise<Roster[]> {
  return await rosterHandler.getAll()
}

export async function history(
  _root: unknown,
  args: { input: HistoryEntry },
): Promise<MetricHistoryEntry[]> {
  const history = new History(prisma)
  const { metrics, start, end, interval, samples, raw } = args.input
  return await history.getHistoryBucketed({
    metrics,
    start,
    end,
    interval,
    samples,
    raw,
  })
}

export async function alarmHistory(
  _root: unknown,
  args: { input: { start: Date; end: Date } },
): Promise<AlarmHistory[]> {
  const { start, end } = args.input
  return await alarmHandler.history({ start, end })
}
