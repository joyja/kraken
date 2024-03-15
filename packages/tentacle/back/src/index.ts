import { createSchema, createYoga } from 'graphql-yoga'
import { createServer } from 'node:http'
import fs from 'fs'
import path from 'path'
import * as resolvers from './resolvers'
import { plc } from './plc'

// available when handling requests, needs to be provided by the implementor ()
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ServerContext {}

const yoga = createYoga<ServerContext>({
		schema: createSchema<ServerContext>({
		typeDefs: fs.readFileSync(path.resolve(process.cwd(), 'src/schema.graphql')).toString(),
		resolvers
	})
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const server = createServer(yoga)
const PORT = 4000

server.listen(PORT, () => {
	plc.transpile()
	void plc.start()
	console.log(`Running a GraphQL API server at http://localhost:${PORT}/graphql`)
})
