import { Modbus } from './modbus.js'
import { Opcua } from './opcua.js'
import { get } from './rest.js'
import { Mqtt } from './mqtt.js'
import path from 'path'
import fs from 'fs'
import { Persistence } from './persistence.js'
import chokidar from 'chokidar'
import { differenceInMilliseconds, getUnixTime } from 'date-fns'
import ts from 'typescript'
import { EventTracker } from './eventTracker.js'
import { type MemoryUsage, type VariableValue } from './generated/graphql.js'
import { pubsub } from './pubsub.js'
import { Log } from 'coral'
import { VariableHistorian } from 'node-opcua'
import mqtt from 'mqtt'
import * as R from 'ramda'
import { readStore, subscribeAndStore } from './mqttSource.js'
import { taplog } from './variables.js'

const log = new Log('plc')

function getDatatype(value: any, context: string): string {
  if (typeof value === 'boolean') {
    return 'BOOLEAN'
  } else if (typeof value === 'string' || value == null) {
    return 'STRING'
  } else if (typeof value === 'number') {
    return 'FLOAT'
  } else {
    log.warn(
      `datatype of ${JSON.stringify(value)} of ${context} could not be determined.`
    )
    return 'STRING'
  }
}

function createFileIfNotExists(path: string, initialValue: string): void {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, initialValue)
  }
}

function createDirIfNotExists(path: string): void {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path)
  }
}

function findAllFiles(
  dir: string,
  extensions: string[],
  filelist: string[] = []
): string[] {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) {
      filelist = findAllFiles(filePath, extensions, filelist)
    } else if (extensions.some((extension) => filePath.endsWith(extension))) {
      filelist.push(filePath)
    }
  })
  return filelist
}

function ensureDirExists(filePath: string): void {
  const dirname = path.dirname(filePath)
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true })
  }
}

function copyFile(source: string, target: string): void {
  ensureDirExists(target)
  fs.copyFileSync(source, target)
}

function removeDir(dir: string, excludeFiles: string[]): void {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((file) => {
      const currentPath = path.join(dir, file)
      if (fs.lstatSync(currentPath).isDirectory()) {
        removeDir(currentPath, excludeFiles)
      } else {
        // Check if the current file is not in the list of excluded files
        if (!excludeFiles.includes(currentPath)) {
          fs.unlinkSync(currentPath)
        }
      }
    })
  }
}

// Function to dynamically import a module and invalidate the cache
async function importFresh(modulePath: string) {
  // Resolve the full path of the module
  // const resolvedPath = require.resolve(modulePath);

  // Delete the module from the cache
  // delete require.cache[resolvedPath];

  // Dynamically import the module, which should now bypass the cache
  return import(`${modulePath}?update=${Date.now()}`)
}

export class PLC {
  public heapDumpInterval?: NodeJS.Timeout
  public modbus: Record<string, Modbus>
  public opcua: Record<string, Opcua>
  public mqtt: Record<string, Mqtt>
  public intervals: Array<{
    interval: NodeJS.Timeout
    scanRate: number
    name: string
  }>
  public global: Record<string, any>
  public metrics: Record<string, any>
  public running: boolean
  public runtimeDir: string
  public developmentDir: string
  public runtimeConfigFile: string
  public runtimeVariableFile: string
  public runtimeClassesDir: string
  public runtimeProgramsDir: string
  public developmentConfigFile: string
  public developmentVariableFile: string
  public developmentClassesDir: string
  public developmentProgramsDir: string
  public config: any
  public variables: any
  public classes: any
  public persistence: any
  public fileChanges: any[] = []
  public watcher: any
  private programCacheId = Date.now()
  constructor() {
    this.modbus = {}
    this.opcua = {}
    this.mqtt = {}
    this.intervals = []
    this.variables = []
    this.global = {}
    this.metrics = {}
    this.running = false

    // Handle runtime dir
    this.runtimeDir = path.resolve(process.cwd(), 'runtime')
    // createDirIfNotExists(this.runtimeDir)
    this.developmentDir = path.resolve(process.cwd(), 'development')
    createDirIfNotExists(this.developmentDir)

    // Handle config
    const configInit = JSON.stringify(
      { tasks: {}, mqtt: {}, modbus: {}, opcua: {} },
      null,
      2
    )
    this.runtimeConfigFile = path.resolve(this.runtimeDir, 'config.js')
    // createFileIfNotExists(this.runtimeConfigFile, configInit)
    this.developmentConfigFile = path.resolve(this.developmentDir, 'config.ts')
    createFileIfNotExists(
      this.developmentConfigFile,
      `export const config = ${configInit}`
    )

    // Handle variables
    const variableInit = JSON.stringify({}, null, 2)
    this.runtimeVariableFile = path.resolve(this.runtimeDir, 'variables.js')
    // createFileIfNotExists(this.runtimeVariableFile, variableInit)
    this.developmentVariableFile = path.resolve(
      this.developmentDir,
      'variables.ts'
    )
    createFileIfNotExists(
      this.developmentVariableFile,
      `export const variables = ${variableInit}`
    )

    // Handle classes dir
    this.runtimeClassesDir = path.resolve(this.runtimeDir, 'classes')
    // createDirIfNotExists(this.runtimeClassesDir)
    this.developmentClassesDir = path.resolve(this.developmentDir, 'classes')
    createDirIfNotExists(this.developmentClassesDir)

    // Handle programs dir
    this.runtimeProgramsDir = path.resolve(this.runtimeDir, 'programs')
    // createDirIfNotExists(this.runtimeProgramsDir)
    this.developmentProgramsDir = path.resolve(this.developmentDir, 'programs')
    createDirIfNotExists(this.developmentProgramsDir)
  }

  async getConfig(): Promise<void> {
    const { config } = await importFresh(this.runtimeConfigFile)
    this.config = config
    const { variables } = await importFresh(this.runtimeVariableFile)
    this.variables = variables
    Object.keys(this.variables).forEach((key) => {
      this.variables[key].changeEvents = new EventTracker()
    })

    if (fs.existsSync(this.runtimeClassesDir)) {
      const classImports = await Promise.all(
        fs
          .readdirSync(path.resolve(this.runtimeClassesDir))
          .map(async (filename) => {
            const classes = import(
              path.resolve(
                this.runtimeClassesDir,
                `${filename}?update=${this.programCacheId}`
              )
            )
            return await classes
          })
      )

      this.classes = classImports.reduce((acc, current) => {
        return [...acc, ...current]
      }, [])
    } else {
      this.classes = []
    }
    this.persistence = new Persistence({
      variables: this.variables,
      global: this.global,
      classes: this.classes
    })
    this.fileChanges = []
    pubsub.publish('fileChanges', this.fileChanges)
    if (this.watcher !== undefined) this.watcher.close()
    this.watcher = chokidar
      .watch(this.developmentDir)
      .on('all', (event, filePath) => {
        if (
          filePath !==
          path.resolve(process.cwd(), 'development/persistence.json')
        ) {
          this.fileChanges.push({
            timestamp: Date.now(),
            event,
            path: filePath.replace(process.cwd(), '')
          })
          pubsub.publish('fileChanges', this.fileChanges)
        }
      })
    setTimeout(() => {
      this.fileChanges.length = 0
      pubsub.publish('fileChanges', this.fileChanges)
    }, 500)
    if (this.config?.modbus !== undefined) {
      Object.keys(this.config.modbus).forEach((modbusKey) => {
        if (this.modbus[modbusKey] !== undefined) {
          void this.modbus[modbusKey].disconnect()
        }
        this.modbus[modbusKey] = new Modbus({
          ...this.config.modbus[modbusKey].config,
          global: this.global
        })
        void this.modbus[modbusKey].connect()
      })
    }
    if (this.config?.opcua !== undefined) {
      Object.keys(this.config.opcua).forEach((opcuaKey) => {
        if (this.opcua[opcuaKey] !== undefined) {
          void this.opcua[opcuaKey].disconnect()
        }
        this.opcua[opcuaKey] = new Opcua({
          ...this.config.opcua[opcuaKey].config,
          global: this.global
        })
        void this.opcua[opcuaKey].connect()
      })
    }
    if (this.config?.mqtt !== undefined) {
      Object.keys(this.config.mqtt).forEach((mqttKey) => {
        if (this.mqtt[mqttKey] !== undefined) {
          void this.mqtt[mqttKey].disconnect()
        }
        //Setup Mqtt Source variables
        const mqttVariables = R.values(this.variables).filter(
          (variable: any) => variable.source?.type === 'mqtt'
        )
        const topics: string[] = R.pipe(
          R.values,
          R.map(R.path(['source', 'topic'])),
          R.uniq
        )(mqttVariables) as string[]
        this.mqtt[mqttKey] = new Mqtt({
          ...this.config.mqtt[mqttKey].config,
          global: this.global
        })
        this.mqtt[mqttKey].connect()
        this.mqtt[mqttKey].client.setMaxListeners(100)
        this.mqtt[mqttKey].client.on('connect', () => {
          subscribeAndStore(
            topics,
            this.mqtt[mqttKey].store,
            this.mqtt[mqttKey].client.client
          )
        })
      })
    }
  }

  transpile(): void {
    const sourceDir = path.resolve(process.cwd(), 'development')
    const outDir = path.resolve(process.cwd(), 'runtime')
    const options = {
      noEmitOnError: false,
      noImplicitAny: true,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      outDir,
      rootDir: sourceDir
    }
    removeDir(outDir, [path.join(outDir, 'persistence.json')])
    ensureDirExists(sourceDir)

    const allFiles = findAllFiles(sourceDir, ['.ts', '.json'])
    const host = ts.createCompilerHost(options)
    host.writeFile = (fileName, contents) => {
      const relativePath = path.relative(sourceDir, fileName)
      const outputPath = path.join(outDir, relativePath)
      ensureDirExists(outputPath)
      fs.writeFileSync(outputPath, contents)
    }

    const tsFiles = allFiles.filter((file) => file.endsWith('.ts'))
    if (tsFiles.length > 0) {
      const program = ts.createProgram(tsFiles, options, host)
      program.emit()
    }

    const jsonFiles = allFiles.filter((file) => file.endsWith('.json'))
    if (jsonFiles.length > 0) {
      jsonFiles.forEach((file) => {
        const relativePath = path.relative(sourceDir, file)
        const outputPath = path.join(outDir, relativePath)
        copyFile(file, outputPath)
      })
    }
    this.programCacheId = Date.now()
    log.info('Compilation and copying completed successfully.')
  }

  async start(): Promise<void> {
    if (!this.running) {
      await this.getConfig()
      Object.keys(this.variables).forEach((variableKey) => {
        const variable = this.variables[variableKey]
        if (
          variable.datatype === 'number' ||
          variable.datatype === 'boolean' ||
          variable.datatype === 'string'
        ) {
          this.global[variableKey] = variable.initialValue
        } else if (
          ![null, undefined].includes(
            this.classes
              .map((item: { name: string }) => item.name)
              .includes(variable.datatype)
          )
        ) {
          const VariableClass = this.classes.find(
            (item: { name: string }) => item.name === variable.datatype
          )
          this.global[variableKey] = new VariableClass({
            global: this.global,
            ...variable.config
          })
          // check for class tasks and run intervals for them
          if (VariableClass.tasks !== undefined) {
            this.global[variableKey].intervals = []
            Object.keys(VariableClass.tasks).forEach((taskKey) => {
              this.global[variableKey].intervals.push(
                setInterval(() => {
                  this.global[variableKey][
                    VariableClass.tasks[taskKey].function
                  ]()
                }, VariableClass.tasks[taskKey].scanRate)
              )
            })
          }
          this.global[variableKey].name = variableKey
        } else {
          log.warn(`the datatype for ${variableKey} is invalid`)
        }
      })
      this.persistence.load()
      for (const taskKey of Object.keys(this.config.tasks)) {
        const { program } = await importFresh(
          path.resolve(
            process.cwd(),
            `runtime/programs/${this.config.tasks[taskKey].program}.js`
          )
        )
        this.metrics[taskKey] = {}
        let intervalStart: [number, number] | undefined
        this.intervals.push({
          interval: setInterval(
            ({ global, persistence, metrics, taskKey }) => {
              void (async ({ global, persistence, metrics, taskKey }) => {
                const variableChanges: VariableValue[] = []
                const intervalStop =
                  intervalStart !== undefined
                    ? process.hrtime(intervalStart)
                    : [0, 0]
                metrics[taskKey].intervalExecutionTime =
                  intervalStop !== undefined
                    ? (intervalStop[0] * 1e9 + intervalStop[1]) / 1e6
                    : 0
                const functionStart = process.hrtime()
                try {
                  await program({ global })
                  const functionStop = process.hrtime(functionStart)
                  const functionModbusStart = process.hrtime()
                  setTimeout(async () => {
                    for (const variableKey of Object.keys(this.variables)) {
                      const variable = this.variables[variableKey]
                      if (variable.source !== undefined) {
                        if (variable.source.type === 'modbus') {
                          if (variable.source.bidirectional) {
                            const value = variable.source.onSend
                              ? variable.source.onSend(this.global[variableKey])
                              : this.global[variableKey]
                            await this.modbus[variable.source.name].write({
                              value,
                              ...variable.source.params
                            })
                          }
                          if (this.modbus[variable.source.name].connected) {
                            void (await this.modbus[variable.source.name]
                              .read(variable.source.params)
                              .then((result) => {
                                if (variable.source.onResponse) {
                                  return (this.global[variableKey] =
                                    variable.source.onResponse(result))
                                } else {
                                  return (this.global[variableKey] = result)
                                }
                              })
                              .catch((error) => {
                                console.log(error)
                              }))
                          }
                        }
                      }
                    }
                  }, 0)
                  const functionModbusStop = process.hrtime(functionModbusStart)
                  const functionOpcuaStart = process.hrtime()
                  for (const opcuaKey of Object.keys(this.opcua)) {
                    const opcuaNodeVariables = Object.keys(this.variables)
                      .filter((variableKey) => {
                        return (
                          this.variables[variableKey].source?.name === opcuaKey
                        )
                      })
                      .filter((variableKey) => {
                        return (
                          this.variables[variableKey].source?.type === 'opcua'
                        )
                      })
                    const opcuaNodeWriteVariables = opcuaNodeVariables.filter(
                      (variableKey) => {
                        return this.variables[variableKey].source?.bidirectional
                      }
                    )
                    const opcuaNodeIds = opcuaNodeVariables.map(
                      (variableKey) => {
                        return this.variables[variableKey].source.params.nodeId
                      }
                    )
                    const opcuaWriteNodes = opcuaNodeWriteVariables.map(
                      (variableKey) => {
                        return {
                          nodeId:
                            this.variables[variableKey].source.params.nodeId,
                          attributeId:
                            this.variables[variableKey].source.params
                              .attributeId,
                          registerType:
                            this.variables[variableKey].source.params
                              .registerType,
                          inputValue: this.global[variableKey]
                        }
                      }
                    )
                    if (opcuaWriteNodes.length > 0) {
                      void (await this.opcua[opcuaKey].write(opcuaWriteNodes))
                    }
                    void this.opcua[opcuaKey]
                      .readMany({ nodeIds: opcuaNodeIds })
                      .then((result) => {
                        if (result != null) {
                          for (let i = 0; i < result.length; i++) {
                            this.global[opcuaNodeVariables[i]] = result[i]
                          }
                        }
                      })
                  }

                  const functionOpcuaStop = process.hrtime(functionOpcuaStart)
                  // Process rest requests
                  setTimeout(async () => {
                    const restVariables = Object.keys(this.variables).filter(
                      (variableKey) => {
                        return (
                          this.variables[variableKey].source?.type === 'rest'
                        )
                      }
                    )
                    for (const variableKey of restVariables) {
                      const variable = this.variables[variableKey]
                      await new Promise((resolve) => setTimeout(resolve, 100))
                      await get(this.global[variableKey], {
                        url: variable.source.url,
                        method: variable.source.method,
                        body: variable.source.body,
                        valuePath: variable.source.valuePath,
                        onResponse: variable.source.onResponse
                      })
                        .then((value) => {
                          this.global[variableKey] = value
                        })
                        .catch((error) => {
                          console.error(error)
                        })
                    }
                  }, 0)
                  const functionMqttStart = process.hrtime()
                  const mqttVariables = Object.keys(this.variables).filter(
                    (variableKey) => {
                      return this.variables[variableKey].source?.type === 'mqtt'
                    }
                  )
                  for (const variableKey of mqttVariables) {
                    const variable = this.variables[variableKey]
                    const store = this.mqtt[variable.source.name].store
                    const { topic, valuePath, onResponse } = variable.source
                    if (R.has(topic, store)) {
                      const value = readStore(topic, store)
                      try {
                        this.global[variableKey] = R.pipe(
                          R.path(valuePath),
                          onResponse ? onResponse : (value) => value
                        )(value)
                      } catch (error) {
                        console.log(
                          `Error reading ${variableKey}, value: ${JSON.stringify(value, null, 2)}`,
                          error
                        )
                      }
                    }
                  }
                  Promise.resolve().then(() => {
                    for (const key of Object.keys(this.variables)) {
                      const now = new Date()
                      const variable = this.variables[key]
                      const isNumeric = variable.datatype === 'number'
                      const lastPublished = variable.lastPublished
                      const lastValue = variable.lastValue
                      const deadbandMaxTime = variable.deadband?.maxTime
                      let outsideDeadband = false
                      if (isNumeric) {
                        const deadband =
                          variable.deadband?.value !== undefined
                            ? variable.deadband.value
                            : 0
                        outsideDeadband =
                          variable.lastValue === undefined ||
                          Math.abs(this.global[key] - variable.lastValue) >
                            deadband
                      } else {
                        outsideDeadband =
                          variable.lastValue !== this.global[key]
                      }
                      const outsideDeadbandMaxTime =
                        lastValue === undefined ||
                        lastPublished === undefined ||
                        differenceInMilliseconds(now, lastPublished) >
                          deadbandMaxTime
                      if (
                        (outsideDeadband || outsideDeadbandMaxTime) &&
                        variable.mqttDisabled !== true
                      ) {
                        this.variables[key].changeEvents.recordEvent()
                        variableChanges.push({
                          name: key,
                          value: JSON.stringify(this.global[key]),
                          type: getDatatype(this.global[key], key),
                          timestamp: getUnixTime(new Date())
                        })
                        for (const mqttKey of Object.keys(this.mqtt)) {
                          this.mqtt[mqttKey].queue.push({
                            name: key,
                            value: this.global[key],
                            type: getDatatype(this.global[key], key),
                            timestamp: getUnixTime(new Date())
                          })
                        }
                        variable.lastValue = this.global[key]
                        variable.lastPublished = now
                      }
                    }
                    if (this.config.publishPerformanceMetrics === true) {
                      const memoryUsage: MemoryUsage = process.memoryUsage()
                      for (const mqttKey of Object.keys(this.mqtt)) {
                        Object.keys(memoryUsage).forEach((key) => {
                          this.mqtt[mqttKey].queue.push({
                            name: `memoryUsage.${key}`,
                            value: memoryUsage[key as keyof MemoryUsage],
                            type: getDatatype(
                              memoryUsage[key as keyof MemoryUsage],
                              key
                            ),
                            timestamp: getUnixTime(new Date())
                          })
                        })
                      }
                    }
                  })
                  const functionMqttStop = process.hrtime(functionMqttStart)
                  metrics[taskKey].modbusExecutionTime =
                    (functionModbusStop[0] * 1e9 + functionModbusStop[1]) / 1e6
                  metrics[taskKey].opcuaExecutionTime =
                    (functionOpcuaStop[0] * 1e9 + functionOpcuaStop[1]) / 1e6
                  metrics[taskKey].mqttExecutionTime =
                    (functionMqttStop[0] * 1e9 + functionMqttStop[1]) / 1e6

                  const persistenceStart = process.hrtime()
                  Promise.resolve().then(() => {
                    persistence.persist()
                  })
                  const persistenceStop = process.hrtime(persistenceStart)

                  metrics[taskKey].persistenceExecutionTime =
                    (persistenceStop[0] * 1e9 + persistenceStop[1]) / 1e6

                  metrics[taskKey].overheadExecutionTime =
                    metrics[taskKey].modbusExecutionTime +
                    metrics[taskKey].opcuaExecutionTime +
                    metrics[taskKey].mqttExecutionTime +
                    metrics[taskKey].persistenceExecutionTime

                  metrics[taskKey].functionExecutionTime =
                    (functionStop[0] * 1e9 + functionStop[1]) / 1e6

                  metrics[taskKey].totalScanTime =
                    metrics[taskKey].functionExecutionTime +
                    metrics[taskKey].overheadExecutionTime +
                    metrics[taskKey].intervalExecutionTime

                  pubsub.publish(
                    'taskMetrics',
                    Object.keys(metrics).map((key) => {
                      return { task: key, ...metrics[key] }
                    })
                  )
                } catch (error) {
                  console.log(error)
                  log.error(`${error}`)
                }
                intervalStart = process.hrtime()
                pubsub.publish('values', variableChanges)
              })({
                global,
                persistence,
                metrics,
                taskKey
              })
            },
            this.config.tasks[taskKey].scanRate,
            {
              global: this.global,
              persistence: this.persistence,
              metrics: this.metrics,
              variables: this.variables,
              modbus: this.modbus,
              opcua: this.opcua,
              taskKey
            }
          ),
          scanRate: this.config.tasks[taskKey].scanRate,
          name: taskKey
        })
      }
      this.running = true
      pubsub.publish('plc', {
        running: this.running
      })
    } else {
      throw Error('The PLC is already running.')
    }
  }

  stop(): void {
    if (this.running) {
      this.intervals.forEach((interval) => {
        clearInterval(interval.interval)
      })
      this.intervals = []
      Object.keys(this.global).forEach((variableKey) => {
        if (this.global[variableKey]?.intervals != null) {
          this.global[variableKey].intervals.forEach(
            (interval: ReturnType<typeof setInterval>) => {
              clearInterval(interval)
            }
          )
          this.global[variableKey].intervals = []
        }
      })
      this.running = false
      pubsub.publish('plc', {
        running: this.running
      })
    } else {
      throw Error('The PLC is already stopped.')
    }
  }

  restart(): void {
    if (this.running) {
      this.stop()
    }
    this.transpile()
    void this.start()
  }
}

export const plc = new PLC()
