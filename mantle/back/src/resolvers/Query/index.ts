import { spdata } from "../../mqtt"
import { alarms } from "../../alarms"

export function info() { return 'Data Acquisition and visualation for tentacle-edge devices.'}

export function groups() {
  return spdata.groups
}

export function alarms() {
  return alarms.getAlarms()
}