import { ISparkplugClientOptions, newClient } from 'kraken-sparkplug-client'
import getUnixTime from 'date-fns/getUnixTime'
import type { UPayload } from 'kraken-sparkplug-client'
import { Log } from '../log/index'

const log = new Log('MQTT')

type Unpacked<T> = T extends (infer U)[] ? U : T;

interface PrimaryHost {
  name: string
  readyForData: boolean
  status: string
  history: UPayload
}

const getDatatype = function (value:boolean | string | number) {
  if (typeof value === 'boolean') {
    return 'BOOLEAN'
  } else if (typeof value === 'string') {
    return 'STRING'
  } else if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return 'INT32'
    } else {
      return 'FLOAT'
    }
  } else {
    throw Error(`The datatype of ${value} could not be determined.`)
  }
}

export class MQTT {
  public client?:ReturnType<typeof newClient>
  public connecting:boolean
  public connected:boolean
  public primaryHosts:PrimaryHost[]
  public metrics:UPayload['metrics']
  private interval?:ReturnType<typeof setInterval>
  private deviceId?:string
  private rate:number
  private config:{
    serverUrl?:string,
    username?:string,
    password?:string,
    groupId?:string,
    edgeNode?:string,
    clientId?:string,
    version:string,
    publishDeath:boolean
  }
  constructor() {
    const serverUrl = process.env.SQUID_MQTT_URL
    const username = process.env.SQUID_MQTT_USERNAME
    const password = process.env.SQUID_MQTT_PASSWORD
    const groupId = process.env.SQUID_MQTT_GROUPID
    const edgeNode = process.env.SQUID_MQTT_EDGENODE
    this.deviceId = process.env.SQUID_MQTT_DEVICEID
    const clientId = process.env.SQUID_MQTT_CLIENTID
    // TODO: Need to figure out how I'm going to populate primary hosts (event variable, config file, etc.)
    const primaryHosts:string[] = []
    this.rate = 2500
    this.config = {
      serverUrl, username, password, groupId, edgeNode, clientId,
      version : 'spBv1.0',
      publishDeath: true
    }
    this.metrics = []
    this.primaryHosts = primaryHosts.map((name) => {
      return {
        name,
        readyForData: false,
        status: 'OFFLINE',
        history: [] as UPayload
      }
    })
    for (const [key, value] of Object.entries(this.config)) {
      if (!value) {
        throw Error(`${key} is not set, please make sure you set the SQUID_${key.toUpperCase()} environment variable.`)
      }
    }
    this.connecting = false;
    this.connected = false;
  }
  async publish() {
    const metrics = this.metrics
    if (metrics!.length > 0) {
      const record:UPayload = {
        timestamp: getUnixTime(new Date()),
        metrics,
      }
      await this.client!.publishDeviceData(this.deviceId!, record)
    }
  }
  addMetric({ name, type, value }:NonNullable<Unpacked<UPayload['metrics']>>) {
    this.metrics?.push({
      name,
      type,
      value,
      timestamp: getUnixTime(new Date())
    })
  }
  updateMetric({ name, value }:{ name:string, value:NonNullable<Unpacked<UPayload['metrics']>>['value'] }) {
    const metric = this.metrics?.find((metric) => {
      return name === metric.name
    })
    if (metric) {
      metric!.value = value
      metric!.timestamp = getUnixTime(new Date())
    } else {
      throw Error(`metric with name ${name} does not exist.`)
    }
  }
  startPublishing(rate?:number) {
    if (rate) {
      this.rate = rate
    }
    if (this.interval) {
      clearInterval(this.interval)
    }
    this.interval = setInterval(() => {
      this.publish()
    },this.rate)
  }
  stopPublishing() {
    clearInterval(this.interval)
  }
  connect() {
    if (!this.client) {
      this.client = newClient(this.config as ISparkplugClientOptions)
      this.client.on('reconnect', () => {
        this.onReconnect()
      })
      // this.client.on('error',this.onError)
      // this.client.on('offline',this.onOffline)
      this.client.on('birth', () => {
        this.onBirth()
      })
      this.client.on('dcmd', (deviceId, payload) => {
        log.info(`Mqtt service received a dcmd for ${deviceId}.`)
        try {
          this.onDcmd(payload)
        } catch (error) {
          log.error(log.getErrorMessage(error))
        }
      })
      this.client.on('ncmd', async (payload:UPayload) => {
        if (payload.metrics) {
          const rebirth = payload.metrics.find(
            (metric) => metric.name === `Node Control/Rebirth`
          )
          if (rebirth) {
            if (rebirth.value) {
              log.info(`Rebirth request detected. Reinitializing...`)
              this.stopPublishing()
              await this.disconnect()
              this.connect()
              this.startPublishing()
            }
          }
        }
      })
    }
  }
  async disconnect() {
    if (this.client) {
      log.info(`Mqtt service is disconnecting.`)
      this.stopPublishing()
      const payload = {
        timestamp: getUnixTime(new Date()),
      }
      await this.client.publishDeviceDeath(`${this.deviceId}`, payload)
      this.client.stop()
      this.client = undefined
    }
  }
  async onBirth() {
    const payload:UPayload = {
      timestamp: getUnixTime(new Date()),
      metrics: [
        { 
          name: 'Node Control/Rebirth',
          timestamp: getUnixTime(new Date()),
          type: "Boolean",
          value: false
        }
      ],
    }
    await this.client!.publishNodeBirth(payload)
    const metrics = this.metrics
    await this.client!.publishDeviceBirth(`${this.deviceId}`, {
      timestamp: getUnixTime(new Date()),
      metrics,
    })
    this.primaryHosts.forEach((host) => {
      if (host.status === `ONLINE` || host.status === `UNKOWN`) {
        host.readyForData = true
      }
    })
    this.client!.on('state', (primaryHostId, state) => {
      if (primaryHostId) {
        const primaryHost = this.primaryHosts
          .filter((host) => host.name === primaryHostId)
          .forEach((host) => {
            log.info(`Received state: ${state} for primary host: ${primaryHostId}`)
            if (host) {
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
  async onReconnect() {
    this.stopPublishing()
    this.startPublishing()
  }
  onDcmd(payload:UPayload) {
    //TODO: add dcmd logic.
  }
}

export const mqtt = new MQTT()