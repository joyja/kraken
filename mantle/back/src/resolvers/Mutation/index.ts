import { spdata } from "../../mqtt"
import { Alarm, 
  CreateAlarm, 
  UpdateAlarm,
  DeleteAlarm, 
  User,
  CreateUser, 
  UpdateUser,
  DeleteUser,
  Roster,
  CreateRoster,
  UpdateRoster,
  DeleteRoster,
  CreateRosterEntry,
  UpdateRosterEntry,
  DeleteRosterEntry,
  MoveUpRosterEntry,
  MoveDownRosterEntry,
} from "../types"
import { alarmHandler } from '../../alarm'
import { userHandler } from "../../user"
import { rosterHandler } from "../../roster"

export async function sendNodeCommand(
  root:unknown, 
  { groupId, nodeId, command, value }:{groupId:string, nodeId:string, command:string, value:string}
) {
  console.log('received node command')
  await spdata.sendNodeCommand({ groupId, nodeId, metricId: `Node Control/${command}`, value })
  console.log('sent node command')
  return true
}

export async function sendDeviceCommand(
  root:unknown, 
  { groupId, nodeId, deviceId, command, value }:{groupId:string, nodeId:string, deviceId:string, command:string, value:string}
) {
  spdata.sendDeviceCommand({ groupId, nodeId, deviceId, metricId: `Device Control/${command}`, value })
  return true
}

export async function createAlarm(root:unknown, { input }:{ input: CreateAlarm}):Promise<Alarm> {
  return alarmHandler.create({ input })
}

export async function updateAlarm(root:unknown, { input }:{ input: UpdateAlarm }):Promise<Alarm> {
  return alarmHandler.update({ input })
}

export async function deleteAlarm(root:unknown, { input }:{ input: DeleteAlarm }):Promise<Alarm> {
  return alarmHandler.delete(input.id)
}

export async function acknowledgeAlarm(root:unknown, { id }:{ id:string }):Promise<Alarm> {
  return alarmHandler.acknowledge(id)
}

export async function createUser(root:unknown, { input }:{ input: CreateUser}):Promise<User> {
  return userHandler.create({ input })
}

export async function updateUser(root:unknown, { input }:{ input: UpdateUser }):Promise<User> {
  return userHandler.update({ input })
}

export async function deleteUser(root:unknown, { input }:{ input: DeleteUser }):Promise<User> {
  return userHandler.delete(input.id)
}

export async function createRoster(root:unknown, { input }:{ input: CreateRoster}) {
  return rosterHandler.create({ input })
}

export async function updateRoster(root:unknown, { input }:{ input: UpdateRoster}) {
  return rosterHandler.update({ input })
}

export async function deleteRoster(root:unknown, { input }:{ input: DeleteRoster}) {
  return rosterHandler.delete(input.id)
}

export async function createRosterEntry(root:unknown, { input }:{ input: CreateRosterEntry}) {
  return rosterHandler.createEntry({ input })
}

export async function updateRosterEntry(root:unknown, { input }:{ input: UpdateRosterEntry}) {
  return rosterHandler.updateEntry({ input })
}

export async function deleteRosterEntry(root:unknown, { input }:{ input: DeleteRosterEntry}) {
  return rosterHandler.deleteEntry(input.id)
}

export async function moveUpRosterEntry(root:unknown, { input }:{ input: MoveUpRosterEntry}) {
  return rosterHandler.moveUpEntry(input.id)
}

export async function moveDownRosterEntry(root:unknown, { input }:{ input: MoveDownRosterEntry}) {
  return rosterHandler.moveDownEntry(input.id)
}

export async function acknowledgeRoster(root:unknown, { id }:{ id:string }) {
  return rosterHandler.acknowledge(id)
}