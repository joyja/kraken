import { createSchema, createYoga, YogaInitialContext } from 'graphql-yoga'
import { createServer } from 'node:http'
import fs from "fs"
import path from "path"
import resolvers from "./resolvers"
import { System } from './data/systeminformation'

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
	const system = new System()
	system.getCurrentLoad()
  console.log(`Running a GraphQL API server at http://localhost:${PORT}/graphql`)
})