import { spdata } from "../../mqtt"

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