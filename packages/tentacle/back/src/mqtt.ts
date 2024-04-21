import { type UPayload, newClient } from 'kraken-sparkplug-client'
import { getUnixTime } from 'date-fns'
import _, { countBy } from 'lodash'
import { denormalize } from './denormalize.js'
import { Log } from 'coral'

const log = new Log('mqtt')

const getDatatype = function(value: any):string {
  if (typeof value === 'boolean') {
    return 'BOOLEAN'
  }
  if (typeof value === 'string') {
    return 'STRING'
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return 'INT32'
    }
    return 'FLOAT'
  }
  log.info(`datatype of ${value} could not be determined.`)
  return 'STRING'
}

interface MqttConstructorInput {
  serverUrl: string
  username: string
  password: string
  groupId: string
  edgeNode: string
  deviceName: string
  rate: number
  clientId: string
  version?: string
  global: any
  primaryHosts?: any[]
  maxHistoryToPublish?: number
}

export class Mqtt {
  queue: any[]

  rate: number

  global: any

  prevGlobal: any

  deviceName: string

  client: any

  interval?: NodeJS.Timeout

  primaryHosts: any[]

  maxHistoryToPublish: number
  
  public config: {
    serverUrl: string
    username: string
    password: string
    groupId: string
    edgeNode: string
    clientId: string
    version: string
    publishDeath: boolean
  }

  constructor({
    serverUrl = 'tcp://localhost:1883',
    username,
    password,
    groupId,
    edgeNode,
    deviceName,
    rate,
    clientId,
    version = 'spBv1.0',
    global,
    primaryHosts = [],
    maxHistoryToPublish = 10,
  }: MqttConstructorInput) {
    this.queue = []
    this.rate = rate
    this.global = global
    this.prevGlobal = JSON.parse(JSON.stringify(this.denormalizedGlobal))
    this.deviceName = deviceName
    this.config = {
      serverUrl,
      username,
      password,
      groupId,
      edgeNode,
      clientId,
      version,
      publishDeath: true,
    }
    this.primaryHosts = primaryHosts.map((name) => ({
      name,
      readyForData: false,
      status: 'OFFLINE',
      history: [],
    }))
    this.maxHistoryToPublish = maxHistoryToPublish
  }

  get denormalizedGlobal():any {
    return denormalize(this.global)
  }


  async publish():Promise<void> {
    if (this.queue.length > 0) {
      const record = {
        timestamp: getUnixTime(new Date()),
        metrics: [...this.queue],
      }
      await this.client.publishDeviceData(this.deviceName, record)
      for (const host of this.primaryHosts) {
        if (host?.readyForData === null || host?.readyForData === undefined) {
          host.history.push({ ...record, isHistorical: true })
        } else {
          const historyToPublish = host.history.splice(
            0,
            this.maxHistoryToPublish - 1,
          )
          for (const storedRecord of historyToPublish) {
            await this.client.publishDeviceData(this.deviceName, storedRecord)
          }
        }
      }
      this.queue = []
    }
  }

  startPublishing():void {
    clearInterval(this.interval)
    this.interval = setInterval(() => {
      void this.publish()
    }, this.rate)
  }

  stopPublishing():void {
    clearInterval(this.interval)
  }

  connect():void {
    this.stopPublishing()
    if (this.client === null || this.client === undefined) {
      this.client = newClient(this.config)
      this.client.on('reconnect', () => {
        void this.onReconnect()
      })
      // this.client.on('error',this.onError)
      // this.client.on('offline',this.onOffline)
      this.client.on('birth', () => {
        void this.onBirth()
      })
      this.client.on('dcmd', (deviceId: string, payload: UPayload) => {
        console.log(`Mqtt service received a dcmd for ${deviceId}.`)
        try {
          this.onDcmd(payload)
        } catch (error) {
          console.log(error)
        }
      })
      this.client.on('ncmd', async (payload: UPayload) => {
        if (payload.metrics !== null && payload.metrics !== undefined) {
          const rebirth = payload.metrics.find(
            (metric) => metric.name === `Node Control/Rebirth`,
          )
          if (rebirth?.value !== null && rebirth?.value !== undefined) {
            console.log(`Rebirth request detected. Reinitializing...`)
            await this.disconnect()
            this.connect()
          }
        }
      })
    }
  }

  async disconnect():Promise<void> {
    if (this.client !== null && this.client !== undefined) {
      console.log(`Mqtt service is disconnecting.`)
      this.stopPublishing()
      const payload = {
        timestamp: getUnixTime(new Date()),
      }
      await this.client.publishDeviceDeath(`${this.deviceName}`, payload)
      this.client.stop()
      this.client = undefined
    }
  }

  onDcmd(payload: UPayload):void {
    const { metrics } = payload
    if (metrics != null) {
      metrics.forEach((metric) => {
        if (metric.name !== null && metric.name !== undefined) {
          const variablePath = metric.name
            .replace('functions/', '')
            .replaceAll('/', '.')
          const variable = _.get(this.global, variablePath)
          if (variable !== undefined) {
            if (typeof variable === 'boolean') {
              _.set(
                this.global,
                variablePath,
                (typeof metric.value === 'string' && metric.value === 'true') ||
                  (typeof metric.value === 'boolean' && metric.value),
              )
            } else if (typeof variable === 'function') {
              // * Need to call the function from the parent to preserve 'this' in classes.
              // * So pop off the function name, get the parent and call the function from the parent.
              const variablePathParts = variablePath.split('.')
              const functionName = variablePathParts.pop()
              const parent = _.get(this.global, variablePathParts.join('.'))
              if (variable.length === 0 && (functionName !== null && functionName !== undefined)) {
                parent[functionName]()
              } else if ((functionName !== null && functionName !== undefined) && typeof metric.value === 'string') {
                parent[functionName](...JSON.parse(metric.value))
              } else {
                console.log('Invalid function call.')
              }
            }
          } else {
            console.log(`${variablePath} does not exits.`)
          }
        }
      })
    }
  }

  async onBirth():Promise<void> {
    const payload = {
      timestamp: getUnixTime(new Date()),
      metrics: [
        {
          name: 'Node Control/Rebirth',
          timestamp: getUnixTime(new Date()),
          type: 'Boolean',
          value: false,
        },
      ],
    }
    await this.client.publishNodeBirth(payload)
    const global = this.denormalizedGlobal
    const metrics = Object.keys(global).map((key) => {
      if (typeof global[key] === 'string' && (global[key]?.includes('function') !== null || global[key]?.includes('function') !== undefined)) {
        const keyParts = key.split('.')
        keyParts.splice(keyParts.length - 1, 0, 'functions')
        return {
          name: keyParts.join('/'),
          value:
            global[key] === 'function0'
              ? false
              : `[${','.repeat(parseInt(global[key].replace('function', '')) - 1)}]`,
          type: global[key] === 'function0' ? 'BOOLEAN' : 'STRING',
          timestamp: getUnixTime(new Date()),
        }
      }
      return {
        name: key.replaceAll('.', '/'),
        value: global[key],
        type: getDatatype(global[key]),
        timestamp: getUnixTime(new Date()),
      }
    })
    await this.client.publishDeviceBirth(`${this.deviceName}`, {
      timestamp: getUnixTime(new Date()),
      metrics,
    })
    this.primaryHosts.forEach((host) => {
      if (host.status === `ONLINE` || host.status === `UNKOWN`) {
        host.readyForData = true
      }
    })
    this.client.on('state', (primaryHostId: string, state: string) => {
      if (primaryHostId !== null && primaryHostId !== undefined) {
        this.primaryHosts
          .filter((host) => host.name === primaryHostId)
          .forEach((host) => {
            console.log(
              `Received state: ${state} for primary host: ${primaryHostId}`,
            )
            if (host !== null && host !== undefined) {
              host.status = `${state}`
              if (`${state}` === `OFFLINE`) {
                host.readyForData = false
              }
              if (`${state}` === `ONLINE`) {
                host.readyForData = true
              }
            }
          })
      }
    })
    this.startPublishing()
  }

  async onReconnect():Promise<void> {
    this.stopPublishing()
    this.startPublishing()
  }
}
