import { createSchema, createYoga } from 'graphql-yoga'
import { createServer } from 'node:http'
import fs from "fs"
import path from "path"
import * as resolvers from "./resolvers"
import { spdata } from "./mqtt"

// available when handling requests, needs to be provided by the implementor
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
	spdata.initialize({
		serverUrl: 'ssl://mqtt.anywherescada.com:8883',
		username: 'joyja',
		password: 'pLLJtj1txGZ4JdrrF2OS',
	})
	spdata.startAutoRebirth(10000)
  console.log(`Running a GraphQL API server at http://localhost:${PORT}/graphql`)
})