import { createSchema, createYoga } from 'graphql-yoga'
import { createServer } from 'node:http'
import fs from 'fs'
import path from 'path'
import * as resolvers from './resolvers/index.js'
import { spdata } from './mqtt.js'
import './notifier.js'
import { Log, LogLevel } from 'coral'
Log.defaultLogLevel = process.env.MANTLE_LOGLEVEL ? process.env.MANTLE_LOGLEVEL as LogLevel : process.env.NODE_ENV === 'development' ? LogLevel.debug : LogLevel.info

const log = new Log('index')

// test
// available when handling requests, needs to be provided by the implementor
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ServerContext {}

const yoga = createYoga<ServerContext>({
	schema: createSchema<ServerContext>({
		typeDefs: fs.readFileSync(path.resolve(process.cwd(), 'src/schema.graphql')).toString(),
		resolvers
	})
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const server = createServer(yoga)
const PORT = process.env.MANTLE_PORT ?? 4000

server.listen(PORT, () => {
	if (
		process.env.MANTLE_MQTTUSERNAME === undefined || 
		process.env.MANTLE_MQTTPASSWORD === undefined
	) {
		log.error('MQTT credentials are not set. Please set the MANTLE_MQTTUSERNAME and MANTLE_MQTTPASSWORD environment variables.')
	} else {
		void spdata.initialize({
			serverUrl: `${process.env.MANTLE_MQTTENCRYPT === '1' ? 'ssl' : 'tcp'}://${process.env.MANTLE_MQTTHOST}:${process.env.MANTLE_MQTTPORT}`,
			username: process.env.MANTLE_MQTTUSERNAME,
			password: process.env.MANTLE_MQTTPASSWORD
		})
		spdata.startAutoRebirth(10000)
		log.info(`Running a GraphQL API server at http://localhost:${PORT}/graphql`)
	}
})
