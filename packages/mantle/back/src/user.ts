import { prisma } from './prisma';
import {
	User as ResolverUser,
	CreateUser as ResolverCreateUser,
	UpdateUser as ResolverUpdateUser
} from './resolvers/types';
import { User as PrismaUser } from '@prisma/client';
// import { Log } from './log';

// const log = new Log('User');

function prismaToResolver(prismaUser: PrismaUser): ResolverUser {
	return prismaUser;
}

class UserHandler {
	create({ input }: { input: ResolverCreateUser }): Promise<ResolverUser> {
		const { id, ...data } = input;
		return prisma.user.create({ data: id ? input : data }).then(prismaToResolver);
	}
	update({ input }: { input: ResolverUpdateUser }): Promise<ResolverUser> {
		const { id, ...updateFields }: { id: string; [key: string]: any } = input;
		const data: { [key: string]: any } = {};
		// Filter out null values
		Object.keys(updateFields).forEach((key: string) => {
			if (updateFields[key]) data[key] = updateFields[key];
		});
		return prisma.user.update({ where: { id }, data }).then(prismaToResolver);
	}
	delete(id: string): Promise<ResolverUser> {
		return prisma.user.delete({ where: { id } }).then(prismaToResolver);
	}
	getAll(): Promise<ResolverUser[]> {
		return prisma.user.findMany().then((users) => users.map(prismaToResolver));
	}
	getOne(id: string): Promise<ResolverUser | void> {
		return prisma.user.findUnique({ where: { id } }).then((user) => {
			if (user) {
				prismaToResolver(user);
			} else {
				throw Error(`User with id ${id} not found`);
			}
		});
	}
}

export const userHandler = new UserHandler();
