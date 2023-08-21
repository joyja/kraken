"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_yoga_1 = require("graphql-yoga");
const node_http_1 = require("node:http");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const resolvers = __importStar(require("./resolvers"));
const mqtt_1 = require("./mqtt");
const yoga = (0, graphql_yoga_1.createYoga)({
    schema: ((0, graphql_yoga_1.createSchema)({
        typeDefs: fs_1.default.readFileSync(path_1.default.resolve(process.cwd(), 'src/schema.graphql')).toString(),
        resolvers
    }))
});
const server = (0, node_http_1.createServer)(yoga);
const PORT = 4000;
server.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    mqtt_1.spdata.initialize({
        serverUrl: `${process.env.MANTLE_MQTTENCRYPT ? 'ssl' : 'tcp'}://${process.env.MANTLE_MQTTHOST}:${process.env.MANTLE_MQTTTPORT}`,
        username: process.env.MANTLE_MQTTUSERNAME,
        password: process.env.MANTLE_MQTTPASSWORD,
    });
    mqtt_1.spdata.startAutoRebirth(10000);
    console.log(`Running a GraphQL API server at http://localhost:${PORT}/graphql`);
}));
