import { createSchema, createYoga, YogaInitialContext } from 'graphql-yoga'
import { createServer } from 'node:http'
import fs from "fs"
import path from "path"
import resolvers from "./resolvers/index.js"
import { System } from './data/systeminformation.js'
import { mqtt } from './mqtt/index.js'
import { nebula } from './nebula/index.js'
import { Log, LogLevel } from 'coral'
Log.defaultLogLevel = process.env.SQUID_LOGLEVEL ? process.env.SQUID_LOGLEVEL as LogLevel : process.env.NODE_ENV === 'development' ? LogLevel.debug : LogLevel.info


// available when handling requests, needs to be provided by the implementor ()
// eslint-disable-next-line @typescript-eslint/ban-types
type ServerContext = {}

const yoga = createYoga<ServerContext>({
	schema: (createSchema<ServerContext>({
		typeDefs: fs.readFileSync(path.resolve(process.cwd(), 'src/schema.graphql')).toString(),
		resolvers
	}))
})

const server = createServer(yoga)
const PORT = 8000

server.listen(PORT, async () => {
	const system = new System()
	await system.initializeMetrics()
	system.startPolling(1000)
	await nebula.initializeMetrics()
	nebula.startPolling(1000)
	await mqtt.connect()
  console.log(`Running a GraphQL API server at http://localhost:${PORT}/graphql`)
})