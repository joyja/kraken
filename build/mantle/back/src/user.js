"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userHandler = void 0;
const prisma_1 = require("./prisma");
// import { Log } from './log';
// const log = new Log('User');
function prismaToResolver(prismaUser) {
    return prismaUser;
}
class UserHandler {
    create({ input }) {
        const { id, ...data } = input;
        return prisma_1.prisma.user.create({ data: id ? input : data }).then(prismaToResolver);
    }
    update({ input }) {
        const { id, ...updateFields } = input;
        const data = {};
        // Filter out null values
        Object.keys(updateFields).forEach((key) => {
            if (updateFields[key])
                data[key] = updateFields[key];
        });
        return prisma_1.prisma.user.update({ where: { id }, data }).then(prismaToResolver);
    }
    delete(id) {
        return prisma_1.prisma.user.delete({ where: { id } }).then(prismaToResolver);
    }
    getAll() {
        return prisma_1.prisma.user.findMany().then((users) => users.map(prismaToResolver));
    }
    getOne(id) {
        return prisma_1.prisma.user.findUnique({ where: { id } }).then((user) => {
            if (user) {
                prismaToResolver(user);
            }
            else {
                throw Error(`User with id ${id} not found`);
            }
        });
    }
}
exports.userHandler = new UserHandler();
