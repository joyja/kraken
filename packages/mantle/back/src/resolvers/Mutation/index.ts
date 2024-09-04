import { spdata } from '../../mqtt.js'
import {
  type Alarm,
  type CreateAlarm,
  type UpdateAlarm,
  type DeleteAlarm,
  type User,
  type CreateUser,
  type UpdateUser,
  type DeleteUser,
  type CreateRoster,
  type UpdateRoster,
  type DeleteRoster,
  type CreateRosterEntry,
  type UpdateRosterEntry,
  type DeleteRosterEntry,
  type MoveUpRosterEntry,
  type MoveDownRosterEntry,
  type Roster,
  type RosterEntry,
} from '../types.js'
import { history } from '../../history.js'
import { alarmHandler } from '../../alarm.js'
import { userHandler } from '../../user.js'
import { rosterHandler } from '../../roster.js'
import { type MetricHistoryEntry } from '../types.js'
// import { Log } from '../../log';
export * from './chart.js'

// const log = new Log('Mutations');

export function sendNodeCommand(
  root: unknown,
  {
    groupId,
    nodeId,
    command,
    // value
  }: { groupId: string; nodeId: string; command: string; value: string },
): boolean {
  spdata.sendNodeCommand({
    groupId,
    nodeId,
    metricId: `Node Control/${command}`,
    value: true,
  })
  return true
}

export function sendDeviceCommand(
  root: unknown,
  {
    groupId,
    nodeId,
    deviceId,
    command,
    value,
  }: {
    groupId: string
    nodeId: string
    deviceId: string
    command: string
    value: string
  },
): boolean {
  spdata.sendDeviceCommand({
    groupId,
    nodeId,
    deviceId,
    metricId: `Device Control/${command}`,
    value,
  })
  return true
}

export async function createAlarm(
  root: unknown,
  { input }: { input: CreateAlarm },
): Promise<Alarm> {
  return await alarmHandler.create({ input })
}

export async function updateAlarm(
  root: unknown,
  { input }: { input: UpdateAlarm },
): Promise<Alarm> {
  return await alarmHandler.update({ input })
}

export async function deleteAlarm(
  root: unknown,
  { input }: { input: DeleteAlarm },
): Promise<Alarm> {
  return await alarmHandler.delete(input.id)
}

export async function acknowledgeAlarm(
  root: unknown,
  { id }: { id: string },
): Promise<Alarm> {
  return await alarmHandler.acknowledge(id)
}

export async function createUser(
  root: unknown,
  { input }: { input: CreateUser },
): Promise<User> {
  return await userHandler.create({ input })
}

export async function updateUser(
  root: unknown,
  { input }: { input: UpdateUser },
): Promise<User> {
  return await userHandler.update({ input })
}

export async function deleteUser(
  root: unknown,
  { input }: { input: DeleteUser },
): Promise<User> {
  return await userHandler.delete(input.id)
}

export async function createRoster(
  root: unknown,
  { input }: { input: CreateRoster },
): Promise<Roster> {
  return await rosterHandler.create({ input })
}

export async function updateRoster(
  root: unknown,
  { input }: { input: UpdateRoster },
): Promise<Roster> {
  return await rosterHandler.update({ input })
}

export async function deleteRoster(
  root: unknown,
  { input }: { input: DeleteRoster },
): Promise<Roster> {
  return await rosterHandler.delete(input.id)
}

export async function createRosterEntry(
  root: unknown,
  { input }: { input: CreateRosterEntry },
): Promise<RosterEntry> {
  return await rosterHandler.createEntry({ input })
}

export async function updateRosterEntry(
  root: unknown,
  { input }: { input: UpdateRosterEntry },
): Promise<RosterEntry> {
  return await rosterHandler.updateEntry({ input })
}

export async function deleteRosterEntry(
  root: unknown,
  { input }: { input: DeleteRosterEntry },
): Promise<RosterEntry> {
  return await rosterHandler.deleteEntry(input.id)
}

export async function moveUpRosterEntry(
  root: unknown,
  { input }: { input: MoveUpRosterEntry },
): Promise<RosterEntry> {
  return await rosterHandler.moveUpEntry(input.id)
}

export async function moveDownRosterEntry(
  root: unknown,
  { input }: { input: MoveDownRosterEntry },
): Promise<RosterEntry> {
  return await rosterHandler.moveDownEntry(input.id)
}

export async function acknowledgeRoster(
  root: unknown,
  { id }: { id: string },
): Promise<Roster> {
  return await rosterHandler.acknowledge(id)
}

export async function deleteHistory(root: unknown, {
  groupId,
  nodeId,
  deviceId,
  metricIds,
  timestamp,
}: {
  groupId: string,
  nodeId: string,
  deviceId: string,
  metricIds: string[]
  timestamp: Date
}):Promise<MetricHistoryEntry[]> {
  return await history.deleteHistory({ groupId, nodeId, deviceId, metricIds, timestamp})
}
