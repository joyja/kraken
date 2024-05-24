import { type Roster, type Alarm } from '@prisma/client'
import { prisma } from '../prisma.js'

export async function roster(parent: Alarm): Promise<Roster | null> {
  if (parent.rosterId !== null && parent.rosterId !== undefined) {
    return await prisma.roster.findUnique({ where: { id: parent.rosterId } })
  } else {
    return null
  }
}
