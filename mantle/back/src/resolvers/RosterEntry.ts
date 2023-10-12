import { RosterEntry } from "@prisma/client";
import { prisma } from "../prisma";

export function user(parent:RosterEntry) {
  return prisma.user.findUnique({ where: { id: parent.userId } })
}

export function roster(parent:RosterEntry) {
  return prisma.roster.findUnique({ where: { id: parent.rosterId } })
}