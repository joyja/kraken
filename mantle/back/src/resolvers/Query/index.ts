import { spdata } from "../../mqtt"

export function info() { return 'Data Acquisition and visualation for tentacle-edge devices.'}

export function groups() {
  return spdata.groups
}