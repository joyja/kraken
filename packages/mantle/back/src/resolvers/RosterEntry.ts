import { type User, type RosterEntry, type Roster } from '@prisma/client'
import { prisma } from '../prisma.js'

export async function user(parent: RosterEntry): Promise<User | null> {
  return await prisma.user.findUnique({ where: { id: parent.userId } })
}

export async function roster(parent: RosterEntry): Promise<Roster | null> {
  return await prisma.roster.findUnique({ where: { id: parent.rosterId } })
}
