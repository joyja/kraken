import { PrismaClient, Alarm as PrismaAlarm } from "@prisma/client"

export const prisma = new PrismaClient()

// interface PrismaModelHandler {
//   findMany(): Promise<any[]>
//   findUnique({}): Promise<any>
//   update({}): Promise<any>
//   create({}): Promise<any>
//   delete({}): Promise<any>
// }

// interface PrismaModel {
//   id: string
// }



// export class ModelHandler<PrismaModelHandlerT extends PrismaModelHandler,T> {
//   private prismaModelHandler: PrismaModelHandlerT
//   constructor(prisma: PrismaModelHandlerT) {
//     this.prismaModelHandler = prisma
//   }
//   async create<InputT>(input:InputT): Promise<T> {
//     return this.prismaModelHandler.create({ data: input })
//   }
//   async update<InputT>(id:string, input:InputT): Promise<T> {
//     return this.prismaModelHandler.update({ where: { id }, data: input })
//   }
//   async delete(id:string): Promise<T> {
//     return this.prismaModelHandler.delete({ where: { id } })
//   }
//   async getAll(): Promise<T[]> {
//     return this.prismaModelHandler.findMany()
//   }
//   async getOne(id:string): Promise<T> {
//     return this.prismaModelHandler.findUnique({ where: { id } })
//   }
// }
