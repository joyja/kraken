import { Modbus } from './modbus'
import { Opcua } from './opcua'
import { Mqtt } from './mqtt'
import path from 'path'
import fs from 'fs'
import { Persistence } from './persistence'
import chokidar from 'chokidar'
import { differenceInMilliseconds, getUnixTime } from 'date-fns'
import ts from 'typescript'

function getDatatype (value:any) {
  if (typeof value === 'boolean') {
    return 'BOOLEAN'
  } else if (typeof value === 'string') {
    return 'STRING'
  } else if (typeof value === 'number') {
    return 'FLOAT'
  } else {
    console.error(`datatype of ${value} could not be determined.`)
    return 'STRING'
  }
}

function createFileIfNotExists (path:string, initialValue:string ) {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(
      path,
      initialValue
    )
  }
}

function createDirIfNotExists (path:string) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path)
  }
}

function findAllFiles(dir: string, extensions: string[], filelist: string[] = []): string[] {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      filelist = findAllFiles(filePath, extensions, filelist);
    } else if (extensions.some(extension => filePath.endsWith(extension))) {
      filelist.push(filePath);
    }
  });
  return filelist;
}

function ensureDirExists(filePath: string) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

function copyFile(source: string, target: string) {
  ensureDirExists(target);
  fs.copyFileSync(source, target);
}

function removeDir(dir: string, excludeFiles: string[]) {
    if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(file => {
            const currentPath = path.join(dir, file);
            if (fs.lstatSync(currentPath).isDirectory()) {
                removeDir(currentPath, excludeFiles);
            } else {
                // Check if the current file is not in the list of excluded files
                if (!excludeFiles.includes(currentPath)) {
                    fs.unlinkSync(currentPath);
                }
            }
        });
    }
}

export class PLC {
  public modbus:{[key:string]:Modbus}
  public opcua:{[key:string]:Opcua}
  public mqtt:{[key:string]:Mqtt}
  public intervals:{ interval: NodeJS.Timeout, scanRate:number, name:string }[]
  public global:{[key:string]:any}
  public metrics:{[key:string]:any}
  public running:boolean
  public runtimeDir:string
  public developmentDir:string
  public runtimeConfigFile:string
  public runtimeVariableFile:string
  public runtimeClassesDir:string
  public runtimeProgramsDir:string
  public developmentConfigFile:string
  public developmentVariableFile:string
  public developmentClassesDir:string
  public developmentProgramsDir:string
  public config:any
  public variables:any
  public classes:any
  public persistence:any
  public fileChanges:any[] = []
  constructor() {
    this.modbus = {}
    this.opcua = {}
    this.mqtt = {}
    this.intervals = []
    this.global = {}
    this.metrics = {}
    this.running = false

    //Handle runtime dir
    this.runtimeDir = path.resolve(process.cwd(), 'runtime')
    // createDirIfNotExists(this.runtimeDir)
    this.developmentDir = path.resolve(process.cwd(), 'development')
    createDirIfNotExists(this.developmentDir)
    
    //Handle config
    const configInit = JSON.stringify({ tasks: {}, mqtt: {}, modbus: {}, opcua: {} }, null, 2)
    this.runtimeConfigFile = path.resolve(this.runtimeDir, 'config.json')
    // createFileIfNotExists(this.runtimeConfigFile, configInit)
    this.developmentConfigFile = path.resolve(this.developmentDir, 'config.json')
    createFileIfNotExists(this.developmentConfigFile, configInit)

    //Handle variables
    const variableInit = JSON.stringify({}, null, 2)
    this.runtimeVariableFile = path.resolve(this.runtimeDir, 'variables.json')
    // createFileIfNotExists(this.runtimeVariableFile, variableInit)
    this.developmentVariableFile = path.resolve(this.developmentDir, 'variables.json')
    createFileIfNotExists(this.developmentVariableFile, variableInit)
    
    //Handle classes dir
    this.runtimeClassesDir = path.resolve(this.runtimeDir, 'classes')
    // createDirIfNotExists(this.runtimeClassesDir)
    this.developmentClassesDir = path.resolve(this.developmentDir, 'classes')
    createDirIfNotExists(this.developmentClassesDir)

    //Handle programs dir
    this.runtimeProgramsDir = path.resolve(this.runtimeDir, 'programs')
    // createDirIfNotExists(this.runtimeProgramsDir)
    this.developmentProgramsDir = path.resolve(this.developmentDir, 'programs')
    createDirIfNotExists(this.developmentProgramsDir)
  }
  getConfig() {
    this.config = JSON.parse(fs.readFileSync(this.runtimeConfigFile, 'utf8'))
    this.variables = JSON.parse(fs.readFileSync(this.runtimeVariableFile, 'utf8'))
    if (fs.existsSync(this.runtimeClassesDir)) {
      this.classes = fs
        .readdirSync(path.resolve(this.runtimeClassesDir))
        .map((filename) => {
          delete require.cache[require.resolve(path.resolve(
            this.runtimeClassesDir,
            `${filename}`
          ))]
          const classes = require(path.resolve(
            this.runtimeClassesDir,
            `${filename}`
          ))
          return classes
        })
        .reduce((acc, current) => {
          return [...acc, ...current]
        }, [])
    } else {
      this.classes = []
    }
    this.persistence = new Persistence({
      variables: this.variables,
      global: this.global,
      classes: this.classes,
    })
    this.fileChanges = []
    chokidar.watch(this.developmentDir).on('all', (event, filePath) => {
      if (
        filePath !== path.resolve(process.cwd(), 'development/persistence.json')
      ) {
        this.fileChanges.push({
          timestamp: Date.now(),
          event,
          path: filePath.replace(process.cwd(), ''),
        })
      }
    })
    setTimeout(() => {
      //Clear out changes so initial files don't get put in the log.
      this.fileChanges.length = 0
    }, 500)
    if (this.config.modbus) {
      Object.keys(this.config.modbus).forEach((modbusKey) => {
        if (this.modbus[modbusKey]) {
          this.modbus[modbusKey].disconnect()
        }
        this.modbus[modbusKey] = new Modbus({
          ...this.config.modbus[modbusKey].config,
          global: this.global,
        })
        this.modbus[modbusKey].connect()
      })
    }
    if (this.config.opcua) {
      Object.keys(this.config.opcua).forEach((opcuaKey) => {
        if (this.opcua[opcuaKey]) {
          this.opcua[opcuaKey].disconnect()
        }
        this.opcua[opcuaKey] = new Opcua({
          ...this.config.opcua[opcuaKey].config,
          global: this.global,
        })
        this.opcua[opcuaKey].connect()
      })
    }
    if (this.config.mqtt) {
      Object.keys(this.config.mqtt).forEach((mqttKey) => {
        if (this.mqtt[mqttKey]) {
          this.mqtt[mqttKey].disconnect()
        }
        this.mqtt[mqttKey] = new Mqtt({
          ...this.config.mqtt[mqttKey].config,
          global: this.global,
        })
        this.mqtt[mqttKey].connect()
      })
    }
  }
  transpile() {
    const sourceDir = path.resolve(process.cwd(), 'development');
    const outDir = path.resolve(process.cwd(), 'runtime');
    const options = {
      noEmitOnError: true,
      noImplicitAny: true,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      outDir,
      rootDir: sourceDir
    }
    removeDir(outDir, [path.join(outDir, 'persistence.json')]);
    ensureDirExists(sourceDir);

    const allFiles = findAllFiles(sourceDir, ['.ts', '.json']);
    const host = ts.createCompilerHost(options);
    host.writeFile = (fileName, contents, writeByteOrderMark) => {
      const relativePath = path.relative(sourceDir, fileName);
      const outputPath = path.join(outDir, relativePath);
      ensureDirExists(outputPath);
      fs.writeFileSync(outputPath, contents);
    };

    const tsFiles = allFiles.filter(file => file.endsWith('.ts'));
    if (tsFiles.length > 0) {
      const program = ts.createProgram(tsFiles, options, host);
      program.emit();
    }

    const jsonFiles = allFiles.filter(file => file.endsWith('.json'));
    if (jsonFiles.length > 0) {
      jsonFiles.forEach(file => {
        const relativePath = path.relative(sourceDir, file);
        const outputPath = path.join(outDir, relativePath);
        copyFile(file, outputPath);
      });
    }

    console.log("Compilation and copying completed successfully.");
  }
  start() {
    if (!this.running) {
      this.getConfig()
      Object.keys(this.variables).forEach((variableKey) => {
        const variable = this.variables[variableKey]
        if (
          variable.datatype === 'number' ||
          variable.datatype === 'boolean' ||
          variable.datatype === 'string'
        ) {
          this.global[variableKey] = variable.initialValue
        } else if (
          this.classes.map((item:{name:string}) => item.name).includes(variable.datatype)
        ) {
          const variableClass = this.classes.find(
            (item:{name:string}) => item.name === variable.datatype
          )
          this.global[variableKey] = new variableClass({
            global: this.global,
            ...variable.config,
          })
          // check for class tasks and run intervals for them
          if (variableClass.tasks) {
            this.global[variableKey].intervals = []
            Object.keys(variableClass.tasks).forEach((taskKey) => {
              this.global[variableKey].intervals.push(setInterval(() => {
                this.global[variableKey][variableClass.tasks[taskKey]['function']]()
              }, variableClass.tasks[taskKey]['scanRate']))
            })
          }
          this.global[variableKey].name = variableKey
        } else {
          console.log(`the datatype for ${variableKey} is invalid`)
        }
      })
      this.persistence.load()
      Object.keys(this.config.tasks).forEach((taskKey) => {
        this.metrics[taskKey] = {}
        let intervalStart: [number, number] | undefined
        this.intervals.push({
          interval: setInterval(
            async ({
              global,
              persistence,
              metrics,
              variables,
              modbus,
              opcua,
              taskKey,
            }) => {
              const intervalStop = intervalStart
                ? process.hrtime(intervalStart)
                : 0
              metrics[taskKey].intervalExecutionTime = intervalStop
                ? (intervalStop[0] * 1e9 + intervalStop[1]) / 1e6
                : 0
              const functionStart = process.hrtime()
              try {
                delete require.cache[require.resolve(path.resolve(
                  path.resolve(
                    process.cwd(),
                    `runtime/programs/${this.config.tasks[taskKey].program}.js`
                  )
                ))]
                const { program } = await import(path.resolve(
                  process.cwd(),
                  `runtime/programs/${this.config.tasks[taskKey].program}.js`
                ))
                program({ global })
                for (const variableKey of Object.keys(this.variables)) {
                  const variable = this.variables[variableKey]
                  if (variable.source) {
                    if (variable.source.type === 'modbus') {
                      // await modbus[variable.source.name].write({
                      //   value: [this.global[variableKey]],
                      //   ...variable.source.params,
                      // })
                      if (this.modbus[variable.source.name].connected) {
                        this.modbus[variable.source.name]
                          .read(variable.source.params)
                          .then((result) => (this.global[variableKey] = result))
                      }
                    }
                    // if (variable.source.type === 'opcua') {
                      // await opcua[variable.source.name].write({
                      //   inputValue: this.global[variableKey],
                      //   ...variable.source.params,
                      // })
                    //   if (this.opcua[variable.source.name].connected) {
                    //     this.opcua[variable.source.name]
                    //       .read(variable.source.params)
                    //       .then((result) => (this.global[variableKey] = result))
                    //   }
                    // }
                  }
                }
                for (const opcuaKey of Object.keys(this.opcua)) {
                  const opcuaNodeVariables = Object.keys(this.variables)
                    .filter((variableKey) => {
                      return this.variables[variableKey].source?.name == opcuaKey
                    })
                    .filter((variableKey) => {
                      return this.variables[variableKey].source?.type === 'opcua'
                    })
                  const opcuaNodeIds = opcuaNodeVariables.map((variableKey) => {
                      return this.variables[variableKey].source.params.nodeId
                    })
                  this.opcua[opcuaKey]
                    .read({ nodeIds: opcuaNodeIds })
                    .then((result) => {
                      if (result) {
                        for (let i = 0; i < result.length; i++) {
                          this.global[opcuaNodeVariables[i]] = result[i]
                        }
                      }
                    })
                }
                for (const key of Object.keys(this.variables)) {
                  const now = new Date()
                  const variable = this.variables[key]
                  const isNumeric = variable.datatype === 'number'
                  const lastPublished = variable.lastPublished
                  const lastValue = variable.lastValue
                  const deadbandMaxTime = variable.deadband?.maxTime
                  let outsideDeadband = false
                  if (isNumeric) {
                    const deadband = variable.deadband?.value || 0
                    outsideDeadband = variable.lastValue === undefined || Math.abs(this.global[key] - variable.lastValue) > deadband
                  } else {
                    outsideDeadband = variable.lastValue !== this.global[key]
                  }
                  let outsideDeadbandMaxTime = lastValue === undefined || lastPublished === undefined || differenceInMilliseconds(now, lastPublished) > deadbandMaxTime
                  if (outsideDeadband || outsideDeadbandMaxTime) {
                    for (const mqttKey of Object.keys(this.mqtt)){
                      this.mqtt[mqttKey].queue.push({
                        name: key.replaceAll('.', '/'),
                        value: this.global[key],
                        type: getDatatype(this.global[key]),
                        timestamp: getUnixTime(new Date()),
                      })
                    }
                    variable.lastValue = this.global[key]
                    variable.lastPublished = now
                  }
                }
                const functionStop = process.hrtime(functionStart)
                metrics[taskKey].functionExecutionTime =
                  (functionStop[0] * 1e9 + functionStop[1]) / 1e6
                persistence.persist()
                metrics[taskKey].totalScanTime =
                  metrics.main.functionExecutionTime +
                  metrics.main.intervalExecutionTime
              } catch (error) {
                console.log(error)
              }
              intervalStart = process.hrtime()
            },
            this.config.tasks[taskKey].scanRate,
            {
              global: this.global,
              persistence: this.persistence,
              metrics: this.metrics,
              variables: this.variables,
              modbus: this.modbus,
              opcua: this.opcua,
              taskKey,
            }
          ),
          scanRate: this.config.tasks[taskKey].scanRate,
          name: taskKey,
        })
      })
      this.running = true
    } else {
      throw Error('The PLC is already running.')
    }
  }
  stop() {
    if (this.running) {
      this.intervals.forEach((interval) => {
        clearInterval(interval.interval)
      })
      this.intervals = []
      Object.keys(this.global).forEach((variableKey) => {
        if (this.global[variableKey].intervals) {
          this.global[variableKey].intervals.forEach((interval:ReturnType<typeof setInterval>) => {
            clearInterval(interval)
          })
          this.global[variableKey].intervals = []
        }
      })
      this.running = false
    } else {
      throw Error('The PLC is already stopped.')
    }
  }
  restart() {
    if (this.running) {
      this.stop()
    }
    this.transpile()
    this.start()
  }
}

export const plc = new PLC()