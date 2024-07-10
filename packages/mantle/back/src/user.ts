import { prisma } from './prisma.js'
import {
  type User as ResolverUser,
  type CreateUser as ResolverCreateUser,
  type UpdateUser as ResolverUpdateUser
} from './resolvers/types.js'
import { type User as PrismaUser } from '@prisma/client'
// import { Log } from './log';

// const log = new Log('User');

function prismaToResolver(prismaUser: PrismaUser): ResolverUser {
  return prismaUser
}

class UserHandler {
  async create({
    input
  }: {
    input: ResolverCreateUser
  }): Promise<ResolverUser> {
    const { id, ...data } = input
    return await prisma.user
      .create({ data: id !== null && id !== undefined ? input : data })
      .then(prismaToResolver)
  }

  async update({
    input
  }: {
    input: ResolverUpdateUser
  }): Promise<ResolverUser> {
    const { id, ...updateFields }: { id: string; [key: string]: any } = input
    const data: Record<string, any> = {}
    // Filter out null values
    Object.keys(updateFields).forEach((key: string) => {
      if (updateFields[key] !== null && updateFields[key] !== undefined)
        data[key] = updateFields[key]
    })
    return await prisma.user
      .update({ where: { id }, data })
      .then(prismaToResolver)
  }

  async delete(id: string): Promise<ResolverUser> {
    return await prisma.user.delete({ where: { id } }).then(prismaToResolver)
  }

  async getAll(): Promise<ResolverUser[]> {
    return await prisma.user
      .findMany()
      .then((users) => users.map(prismaToResolver))
  }

  async getOne(id: string): Promise<ResolverUser> {
    return await prisma.user.findUnique({ where: { id } }).then((user) => {
      if (user !== null && user !== undefined) {
        return prismaToResolver(user)
      } else {
        throw Error(`User with id ${id} not found`)
      }
    })
  }
}

export const userHandler = new UserHandler()
