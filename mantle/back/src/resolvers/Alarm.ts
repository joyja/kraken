import { Alarm } from "@prisma/client";
import { prisma } from "../prisma";
import { spdata } from "../mqtt";


export function roster(parent:Alarm) {
  if (parent.rosterId !== null && parent.rosterId !== undefined) {
    return prisma.roster.findUnique({ where: { id: parent.rosterId } })
  } else {
    return null
  }
}

// export function metric(parent:Alarm) {
//   if (parent.deviceId) {}
//   return spdata.groups.find((group) => {
//     return group.id === parent.groupId
//   })?.nodes.find((node) => {
//     return node.id === parent.nodeId
//   })?.devices.find((device) => {
//     return device.id === parent.deviceId
//   })?.metrics.find((metric) => {
//     return metric.id === parent.metricId
//   })
// }