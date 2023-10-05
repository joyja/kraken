import { spdata } from "../../mqtt"
import { Alarm, CreateAlarm, DeleteAlarm, UpdateAlarm } from "../types"
import { alarms } from '../../alarm'

export function sendNodeCommand(
  root:unknown, 
  { groupId, nodeId, metricId, value }:{groupId:string, nodeId:string, metricId:string, value:string}
) {
  return spdata.sendNodeCommand({ groupId, nodeId, metricId, value })
}

export function sendDeviceCommand(
  root:unknown, 
  { groupId, nodeId, deviceId, metricId, value }:{groupId:string, nodeId:string, deviceId:string, metricId:string, value:string}
) {
  return spdata.sendDeviceCommand({ groupId, nodeId, deviceId, metricId, value })
}

export async function createAlarm(root:unknown, { input }:{ input: CreateAlarm}):Promise<Alarm> {
  return alarms.createAlarm(input)
}

export async function updateAlarm(root:unknown, { input }:{ input: UpdateAlarm }):Promise<Alarm> {
  const alarm = alarms.getAlarm(input.id)
  if (!alarm) throw new Error(`There is no alarm with id ${input.id}.`)
  await alarm?.update(input)
  return alarm
}

export async function deleteAlarm(root:unknown, { input }:{ input: DeleteAlarm }):Promise<Alarm> {
  const alarm = alarms.getAlarm(input.id)
  if (!alarm) throw new Error(`There is no alarm with id ${input.id}.`)
  await alarm?.delete()
  return alarm
}