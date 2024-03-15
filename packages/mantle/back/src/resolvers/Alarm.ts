import { Alarm } from '@prisma/client';
import { prisma } from '../prisma';

export function roster(parent: Alarm) {
	if (parent.rosterId !== null && parent.rosterId !== undefined) {
		return prisma.roster.findUnique({ where: { id: parent.rosterId } });
	} else {
		return null;
	}
}
