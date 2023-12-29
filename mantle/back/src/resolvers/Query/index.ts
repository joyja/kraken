import { prisma } from "../../prisma"
import { spdata } from "../../mqtt"
import { alarmHandler } from "../../alarm"
import { Alarm } from "../types"
import { ChartPage } from "@prisma/client"
import { rosterHandler } from "../../roster"
import { userHandler } from "../../user"

export function info() { return 'Sparkplug B Historian and Alarm Notifier'}

export function groups(_root:unknown, args:{historyDuration:number}) {
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

export async function chartPages():Promise<ChartPage[]> {
  return prisma.chartPage.findMany({ include: { charts: { include: { pens: true }}}})
}