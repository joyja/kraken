import { createSchema, createYoga } from 'graphql-yoga'
import { createServer } from 'node:http'
import fs from 'fs'
import path from 'path'
import * as resolvers from './resolvers/index.js'
import { plc } from './plc.js'
import { Log, LogLevel } from 'coral'
import EventEmitter from 'events'

EventEmitter.setMaxListeners(25)

Log.defaultLogLevel = process.env.TENTACLE_LOGLEVEL
  ? (process.env.TENTACLE_LOGLEVEL as LogLevel)
  : process.env.NODE_ENV === 'development'
    ? LogLevel.debug
    : LogLevel.info

const log = new Log('index')

// available when handling requests, needs to be provided by the implementor ()

interface ServerContext {}

const yoga = createYoga<ServerContext>({
  schema: createSchema<ServerContext>({
    typeDefs: fs
      .readFileSync(path.resolve(process.cwd(), 'src/schema.graphql'))
      .toString(),
    resolvers
  })
})

const server = createServer(yoga)
const PORT = process.env.TENTACLE_PORT ?? 4010

server.listen(PORT, () => {
  plc.transpile()
  void plc.start()
  log.info(`Running a GraphQL API server at http://localhost:${PORT}/graphql`)
})

process.on('SIGINT', () => {
  plc.stop()
  server.close()
  process.exit()
})
