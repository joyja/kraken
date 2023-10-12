import { spdata } from "../../mqtt"
import { alarmHandler } from "../../alarm"
import { Alarm } from "../types"
import { rosterHandler } from "../../roster"
import { userHandler } from "../../user"

export function info() { return 'Sparkplug B Historian and Alarm Notifier'}

export function groups() {
  return spdata.groups
}

export function alarms():Promise<Alarm[]> {
  return alarmHandler.getAll()
}

export function users() {
  return userHandler.getAll()
}

export function rosters() {
  return rosterHandler.getAll()
}