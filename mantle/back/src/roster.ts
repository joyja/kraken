
import { prisma } from './prisma'
import { 
  Roster as ResolverRoster, 
  CreateRoster as ResolverCreateRoster, 
  UpdateRoster as ResolverUpdateRoster,
  RosterEntry as ResolverRosterEntry,
  CreateRosterEntry as ResolverCreateRosterEntry,
  UpdateRosterEntry as ResolverUpdateRosterEntry,
} from './resolvers/types'
import { Roster as PrismaRoster, RosterEntry } from '@prisma/client'
import { Log } from './log'
import { alarmHandler } from './alarm'

const log = new Log('Roster')

function prismaToResolver(prismaRoster:PrismaRoster) {
  return prismaRoster
}

class RosterHandler {
  create({ input }:{ input: ResolverCreateRoster }) {
    return prisma.roster.create({ data: input, include: { users:true, alarms:true } }).then(prismaToResolver)
  }
  update({ input }:{ input: ResolverUpdateRoster }) {
    const { id, ...updateFields }:{ id: string; [key: string]: any } = input
    const data:{[key:string]:any} = {}
    // Filter out null values
    Object.keys(updateFields).forEach((key:string) => {
      if (updateFields[key]) data[key] = updateFields[key]
    })
    return prisma.roster.update({ where: { id }, data, include: { users:true, alarms:true } }).then(prismaToResolver)
  }
  delete(id:string) {
    return prisma.roster.delete({ where: { id }, include: { users: true, alarms: true }}).then(prismaToResolver)
  }
  getAll() {
    return prisma.roster.findMany({ include: { users: true, alarms: true }}).then(users => users.map(prismaToResolver))
  }
  getOne(id:string): Promise<ResolverRoster | void> {
    return prisma.roster.findUnique({ where: { id }, include: { users: true, alarms: true } })
      .then((user) => {
        if (user) {
          prismaToResolver(user)
        } else {
          throw Error(`Roster with id ${ id } not found`)
        }
      })
  }
  async createEntry({ input }:{ input: ResolverCreateRosterEntry }) {
    const rosterId = input.rosterId
    const entries = await prisma.rosterEntry.findMany({ where: { rosterId } })
    let order = 0
    if (entries.length > 0) {
      order = entries.reduce((acc, entry) => {
        return acc > entry.order ? acc : entry.order
      }, 0) + 1
    }
    return prisma.rosterEntry.create({ data: { ...input, order }})
  }
  async updateEntry({ input }:{ input: ResolverUpdateRosterEntry }) {
    const { id, ...updateFields }:{ id: string; [key: string]: any } = input
    const data:{[key:string]:any} = {}
    // Filter out null values
    Object.keys(updateFields).forEach((key:string) => {
      if (updateFields[key]) data[key] = updateFields[key]
    })
    return prisma.rosterEntry.update({ where: { id }, data })
  }
  async deleteEntry(id:string) {
    const entry = await prisma.rosterEntry.findUnique({ where: { id } })
    if (entry) {
      const entries = await prisma.rosterEntry.findMany({ where: { rosterId: entry.rosterId }})
      const order = entry.order
      await Promise.all(entries.filter(e => e.order > order).map(async (e) => {
        await prisma.rosterEntry.update({ where: { id: e.id }, data: { order: e.order - 1 }})
      }))
    }
    return prisma.rosterEntry.delete({ where: { id } })
  }
  async moveUpEntry(id:string) {
    const entry = await prisma.rosterEntry.findUnique({ where: { id } })
    if (entry) {
      const entries = await prisma.rosterEntry.findMany({ where: { rosterId: entry.rosterId }})
      const order = entry.order
      if (order > 0) {
        const prevEntry = entries.find(e => e.order === order - 1)
        if (prevEntry) {
          await prisma.rosterEntry.update({ where: { id: prevEntry.id }, data: { order }})
          await prisma.rosterEntry.update({ where: { id }, data: { order: order - 1 }})
        }
      }
    }
  }
  async moveDownEntry(id:string) {
    const entry = await prisma.rosterEntry.findUnique({ where: { id } })
    if (entry) {
      const entries = await prisma.rosterEntry.findMany({ where: { rosterId: entry.rosterId }})
      const order = entry.order
      if (order < entries.length - 1) {
        const nextEntry = entries.find(e => e.order === order + 1)
        if (nextEntry) {
          await prisma.rosterEntry.update({ where: { id: nextEntry.id }, data: { order }})
          await prisma.rosterEntry.update({ where: { id }, data: { order: order + 1 }})
        }
      }
    }
  }
  async getActiveRosters() {
    const unack = await alarmHandler.getUnack()
    const rosters = await Promise.all(unack
      .map(alarm => alarm.roster?.id)
      .filter((roster) => roster !== undefined && roster !== null)
      .map((roster) => prisma.roster.findUnique({ where: { id: roster! }, include: { users: true } }))
    )
    return rosters
  }
  async acknowledge(id:string) {
    const roster = await prisma.roster.findUnique({ where: { id }, include: { users: true, alarms: true } })
    if (roster) {
      await Promise.all(roster.alarms.map(alarm => {
        alarmHandler.acknowledge(alarm.id)
      }))
    } else {
      throw Error(`Roster with id ${ id } not found`)
    }
    return roster
  }
}

export const rosterHandler = new RosterHandler()
