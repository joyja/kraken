import path from 'path'
import { parentPort } from 'worker_threads'

async function importFresh(modulePath:string) {
  // Resolve the full path of the module
  const resolvedPath = require.resolve(modulePath);

  // Delete the module from the cache
  delete require.cache[resolvedPath];

  // Dynamically import the module, which should now bypass the cache
  return require(resolvedPath);
}

interface TaskCreateArgs {
  filePath: string
}

interface TaskValuesMessage {
  global: {[key:string]:string}
}

class Task {
  state:'running' | 'stopped'
  filePath: string
  interval?: ReturnType<typeof setInterval>
  metrics:Record<string, any>
  constructor({ filePath }:TaskCreateArgs) {
    this.filePath = filePath
    this.metrics = []
    this.state = 'stopped'
  }
  async start() {
    if (this.state !== 'running') {
      const { program } = await importFresh(path.resolve(
        process.cwd(),
        this.filePath
      ))
      this.interval = setInterval(
        () => {
          void(async () => {
            await program({ global })          
          })()
        }, 
        1000
      )
    } else {
      throw Error('This task is already running')
    }
  }
  stop() {
    clearInterval(this.interval);
  }
}

let task:Task

parentPort?.on('message', async (args) => {
  const { action } = args
  if (action === 'create') {
    const { filePath, variables } = args
    task = new Task({ filePath })
  } else if (action === 'start') {
    if (task !== undefined || task !== null) {
      task.start()
    } else {
      parentPort?.postMessage('Task must be created before it can be started. Send a create message with a file path before sending a start message.')
    }
  } else if (action === 'stop') {
    if (task && task.state === 'running')
    task.stop()
  } else {
    parentPort?.postMessage(`invalid action recieved, ${action}, must be create, values, start, or stop.`)
  }
})