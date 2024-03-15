"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_yoga_1 = require("graphql-yoga");
const node_http_1 = require("node:http");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const resolvers_1 = __importDefault(require("./resolvers"));
const systeminformation_1 = require("./data/systeminformation");
const index_1 = require("./mqtt/index");
const index_2 = require("./nebula/index");
const yoga = (0, graphql_yoga_1.createYoga)({
    schema: ((0, graphql_yoga_1.createSchema)({
        typeDefs: fs_1.default.readFileSync(path_1.default.resolve(process.cwd(), 'src/schema.graphql')).toString(),
        resolvers: resolvers_1.default
    }))
});
const server = (0, node_http_1.createServer)(yoga);
const PORT = 8000;
server.listen(PORT, async () => {
    const system = new systeminformation_1.System();
    await system.initializeMetrics();
    system.startPolling(1000);
    await index_2.nebula.initializeMetrics();
    index_2.nebula.startPolling(1000);
    await index_1.mqtt.connect();
    console.log(`Running a GraphQL API server at http://localhost:${PORT}/graphql`);
});
