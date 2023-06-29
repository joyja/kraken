import SparkplugClientLib from 'kraken-sparkplug-client'
import getUnixTime from 'date-fns/getUnixTime'
import type { UPayload } from 'kraken-sparkplug-client'

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
  public client?:ReturnType<typeof SparkplugClientLib.newClient>
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
    this.rate = 1000
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
      name === metric.name
    })
    if (metric) {
      metric!.value = value
      metric!.timestamp = getUnixTime(new Date())
    } else {
      throw Error(`metric with name ${name} is does not exist.`)
    }
  }
  startPublishing(rate?:number) {
    if (rate) {
      this.rate = rate
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
      this.client = SparkplugClientLib.newClient(this.config as SparkplugClientLib.ISparkplugClientOptions)
      this.client.on('reconnect', () => {
        this.onReconnect()
      })
      // this.client.on('error',this.onError)
      // this.client.on('offline',this.onOffline)
      this.client.on('birth', () => {
        this.onBirth()
      })
      this.client.on('dcmd', (deviceId, payload) => {
        console.log(`Mqtt service received a dcmd for ${deviceId}.`)
        try {
          this.onDcmd(payload)
        } catch (error) {
          console.log(error)
        }
      })
      this.client.on('ncmd', (payload) => {
        if (payload.metrics) {
          const rebirth = payload.metrics.find(
            (metric) => metric.name === `Node Control/Rebirth`
          )
          if (rebirth) {
            if (rebirth.value) {
              console.log(`Rebirth request detected. Reinitializing...`)
              this.disconnect()
              this.connect()
            }
          }
        }
      })
    }
  }
  async onReconnect() {
    this.stopPublishing()
    this.startPublishing()
  }
}

export const mqtt = new MQTT()