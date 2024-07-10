import { prisma } from './prisma.js'
import {
  type Roster as ResolverRoster,
  type CreateRoster as ResolverCreateRoster,
  type UpdateRoster as ResolverUpdateRoster,
  type RosterEntry as ResolverRosterEntry,
  type CreateRosterEntry as ResolverCreateRosterEntry,
  type UpdateRosterEntry as ResolverUpdateRosterEntry,
  type Alarm as ResolverAlarm,
  type AlarmCondition,
  type AlarmPriority
} from './resolvers/types.js'
import {
  type Roster as PrismaRoster,
  type RosterEntry,
  type Alarm
} from '@prisma/client'
import { alarmHandler } from './alarm.js'
// import { Log } from './log';

// const log = new Log('Roster');

function prismaToResolver(
  prismaRoster: PrismaRoster & { alarms: Alarm[] } & { users: RosterEntry[] }
): ResolverRoster {
  const alarms: ResolverAlarm[] = prismaRoster.alarms.map((alarm) => {
    return {
      ...alarm,
      condition: alarm.condition as AlarmCondition,
      priority: alarm.priority as AlarmPriority
    }
  })
  const users: ResolverRosterEntry[] = prismaRoster.users.map((user) => {
    return {
      ...user
    }
  })
  return {
    ...prismaRoster,
    alarms,
    users
  }
}

export class RosterHandler {
  async create({
    input
  }: {
    input: ResolverCreateRoster
  }): Promise<ResolverRoster> {
    return await prisma.roster
      .create({ data: input, include: { users: true, alarms: true } })
      .then(prismaToResolver)
  }

  async update({
    input
  }: {
    input: ResolverUpdateRoster
  }): Promise<ResolverRoster> {
    const { id, ...updateFields }: { id: string; [key: string]: any } = input
    const data: Record<string, any> = {}
    // Filter out null values
    Object.keys(updateFields).forEach((key: string) => {
      if (updateFields[key] !== null && updateFields[key] !== undefined)
        data[key] = updateFields[key]
    })
    return await prisma.roster
      .update({
        where: { id },
        data,
        include: { users: { orderBy: { order: 'asc' } }, alarms: true }
      })
      .then(prismaToResolver)
  }

  async delete(id: string): Promise<ResolverRoster> {
    return await prisma.roster
      .delete({
        where: { id },
        include: { users: { orderBy: { order: 'asc' } }, alarms: true }
      })
      .then(prismaToResolver)
  }

  async getAll(): Promise<ResolverRoster[]> {
    return await prisma.roster
      .findMany({
        include: { users: { orderBy: { order: 'asc' } }, alarms: true }
      })
      .then((users) => users.map(prismaToResolver))
  }

  async getOne(id: string): Promise<ResolverRoster | null> {
    return await prisma.roster
      .findUnique({
        where: { id },
        include: { users: { orderBy: { order: 'asc' } }, alarms: true }
      })
      .then((user) => {
        if (user !== null && user !== undefined) {
          return prismaToResolver(user)
        } else {
          throw Error(`Roster with id ${id} not found`)
        }
      })
  }

  async createEntry({
    input
  }: {
    input: ResolverCreateRosterEntry
  }): Promise<ResolverRosterEntry> {
    const rosterId = input.rosterId
    const entries = await prisma.rosterEntry.findMany({ where: { rosterId } })
    let order = 0
    if (entries.length > 0) {
      order =
        entries.reduce((acc, entry) => {
          return acc > entry.order ? acc : entry.order
        }, 0) + 1
    }
    return await prisma.rosterEntry.create({ data: { ...input, order } })
  }

  async updateEntry({
    input
  }: {
    input: ResolverUpdateRosterEntry
  }): Promise<ResolverRosterEntry> {
    const { id, ...updateFields }: { id: string; [key: string]: any } = input
    const data: Record<string, any> = {}
    // Filter out null values
    Object.keys(updateFields).forEach((key: string) => {
      if (updateFields[key] !== null && updateFields[key] !== undefined)
        data[key] = updateFields[key]
    })
    return await prisma.rosterEntry.update({ where: { id }, data })
  }

  async deleteEntry(id: string): Promise<ResolverRosterEntry> {
    const entry = await prisma.rosterEntry.findUnique({ where: { id } })
    if (entry !== null && entry !== undefined) {
      const entries = await prisma.rosterEntry.findMany({
        where: { rosterId: entry.rosterId }
      })
      const order = entry.order
      await Promise.all(
        entries
          .filter((e) => e.order > order)
          .map(async (e) => {
            await prisma.rosterEntry.update({
              where: { id: e.id },
              data: { order: e.order - 1 }
            })
          })
      )
    }
    return await prisma.rosterEntry.delete({ where: { id } })
  }

  async moveUpEntry(id: string): Promise<ResolverRosterEntry> {
    const entry = await prisma.rosterEntry.findUnique({ where: { id } })
    if (entry !== null && entry !== undefined) {
      const entries = await prisma.rosterEntry.findMany({
        where: { rosterId: entry.rosterId }
      })
      const order = entry.order
      if (order > 0) {
        const prevEntry = entries.find((e) => e.order === order - 1)
        if (prevEntry !== null && prevEntry !== undefined) {
          await prisma.rosterEntry.update({
            where: { id: prevEntry.id },
            data: { order }
          })
          return await prisma.rosterEntry.update({
            where: { id },
            data: { order: order - 1 }
          })
        } else {
          return entry
        }
      } else {
        return entry
      }
    } else {
      throw Error(`RosterEntry with id ${id} not found`)
    }
  }

  async moveDownEntry(id: string): Promise<ResolverRosterEntry> {
    const entry = await prisma.rosterEntry.findUnique({ where: { id } })
    if (entry !== null && entry !== undefined) {
      const entries = await prisma.rosterEntry.findMany({
        where: { rosterId: entry.rosterId }
      })
      const order = entry.order
      if (order < entries.length - 1) {
        const nextEntry = entries.find((e) => e.order === order + 1)
        if (nextEntry !== null && nextEntry !== undefined) {
          await prisma.rosterEntry.update({
            where: { id: nextEntry.id },
            data: { order }
          })
          return await prisma.rosterEntry.update({
            where: { id },
            data: { order: order + 1 }
          })
        } else {
          return entry
        }
      } else {
        return entry
      }
    } else {
      throw Error(`RosterEntry with id ${id} not found`)
    }
  }

  async getActiveRosters(): Promise<ResolverRoster[]> {
    const unack = await alarmHandler.getUnack()
    const rosters = await Promise.all(
      unack
        .map((alarm) => alarm.roster?.id)
        .filter((roster) => roster !== undefined && roster !== null)
        .map(async (roster) => {
          if (roster === null || roster === undefined) return
          return await prisma.roster.findUnique({
            where: { id: roster },
            include: { users: { orderBy: { order: 'asc' } }, alarms: true }
          })
        })
    )
    return rosters.map((roster) => {
      return roster !== null && roster !== undefined
        ? prismaToResolver(roster)
        : null
    }) as ResolverRoster[]
  }

  async acknowledge(id: string): Promise<ResolverRoster> {
    const roster = await prisma.roster.findUnique({
      where: { id },
      include: { users: { orderBy: { order: 'asc' } }, alarms: true }
    })
    if (roster !== null && roster !== undefined) {
      await Promise.all(
        roster.alarms.map(async (alarm) => {
          return await alarmHandler.acknowledge(alarm.id)
        })
      )
    } else {
      throw Error(`Roster with id ${id} not found`)
    }
    return prismaToResolver(roster)
  }
}

export const rosterHandler = new RosterHandler()
