import { newHost, type UPayload, type UTemplate } from 'kraken-sparkplug-client'
import { v4 as uuidv4} from 'uuid'
import { History } from './history'
import events from 'events'
import { Log } from './log'
import { alarmHandler } from './alarm'
import { prisma } from './prisma'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

const log = new Log('mqtt')
type Unpacked<T> = T extends (infer U)[] ? U : T

interface SparkplugBasicInit { 
  id:string, 
  timestamp?:Unpacked<UPayload>['timestamp'] 
}

//Contains data that all sparkplug classes should have
class SparkplugBasic {
  id:string
  updatedOn:Date
  timestamp?:number | Long.Long | null
  constructor({ id, timestamp }:SparkplugBasicInit) {
    this.id = id
    this.timestamp = timestamp
    if (timestamp && typeof timestamp !== 'number') {
      this.updatedOn = new Date(timestamp.toNumber() * 1000)
    } else {
      this.updatedOn = timestamp ? new Date(timestamp * 1000) : new Date()
    }
  }
}

//For any sparkplug classes that have metrics
class SparkplugBasicMetrics extends SparkplugBasic{
  metrics:SparkplugMetric[]
  constructor(init:SparkplugBasicInit) {
    super(init)
    this.metrics = []
  }
  updateMetrics({ groupId, nodeId, deviceId }:{ groupId:string, nodeId:string, deviceId?:string }, history:History, payload:UPayload | UTemplate) {
    if (payload.metrics) {
      for(const payloadMetric of payload.metrics) {
        if (payloadMetric.name) {
          let metric = this.getMetric(payloadMetric.name)
          if (metric) {
            metric.update(payloadMetric)
          } else {
            metric = new SparkplugMetric({ groupId, nodeId, deviceId, id: payloadMetric.name, timestamp: payloadMetric.timestamp, ...payloadMetric } )
            this.metrics.push(metric)
          }
          history.log(metric).catch((error) => {
            if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
              console.log('Unique constraint violation:', error.meta?.target);
            } else {
              // Handle or throw any other errors
              throw error
            } 
          })
          if (alarmHandler) {
            alarmHandler.evaluateMetricAlarms(metric)
          }
          log.info(`Metric ${metric.id} updated to value ${JSON.stringify(payloadMetric.value, null, 4)}`)
        }
      }
    }
  }
  getMetric(id:string) {
    return this.metrics.find((metrics) => id === metrics.id )
  }
}

export interface SparkplugMetric extends NonNullable<Unpacked<UPayload['metrics']>> {
  updateCount:number
}
interface SparkplugMetricInit extends NonNullable<Unpacked<UPayload['metrics']>> {
  id:string,
  groupId:string
  nodeId:string
  deviceId?:string
  timestamp?:Unpacked<UPayload>['timestamp']
}

export class SparkplugMetric extends SparkplugBasicMetrics {
  public updateCount = 0
  public groupId:string
  public nodeId:string
  public deviceId?:string
  constructor(init:SparkplugMetricInit) {
    super(init)
    this.groupId = init.groupId
    this.nodeId = init.nodeId
    this.deviceId = init.deviceId
    Object.assign(this, { ...init, timestamp:this.timestamp })
  }
  update(update:NonNullable<Unpacked<UPayload['metrics']>>) {
    Object.assign(this, { ...update, })
    this.updateCount += 1
    if (update.timestamp && typeof update.timestamp !== 'number') {
      this.updatedOn = new Date(update.timestamp.toNumber() * 1000)
    } else {
      this.updatedOn = update.timestamp ? new Date(update.timestamp * 1000) : new Date()
    }
  }
}

class SparkplugDevice extends SparkplugBasicMetrics {
  constructor(init:SparkplugBasicInit) {
    super(init)
  }
  get children() {
    return this.metrics
  }
}

class SparkplugNode extends SparkplugBasicMetrics {
  devices: SparkplugDevice[]
  unbornDevices: SparkplugDevice[]
  constructor(init:SparkplugBasicInit) {
    super(init)
    this.devices = []
    this.unbornDevices = []
  }
  getDevice(id:string) {
    return this.devices.find((device) =>  id === device.id )
  }
  getUnbornDevice(id:string) {
    return this.unbornDevices.find((device) =>  id === device.id )
  }
  dropDevice(id:string) {
    this.devices = this.devices.filter((device) => {
      return device.id !== id
    })
  }
  dropUnbornDevice(id:string) {
    this.unbornDevices = this.unbornDevices.filter((device) => {
      return device.id !== id
    })
  }
  get children() {
    return this.devices
  }
}

class SparkplugGroup extends SparkplugBasic {
  nodes: SparkplugNode[]
  unbornNodes: SparkplugNode[]
  constructor(init:SparkplugBasicInit) {
    super(init)
    this.nodes = []
    this.unbornNodes = []
  }
  getNode(id:string) {
    return this.nodes.find((node) => id === node.id)
  }
  getUnbornNode(id:string) {
    return this.unbornNodes.find((node) => id === node.id)
  }
  dropNode(id:string) {
    this.nodes = this.nodes.filter((node) => {
      return node.id !== id
    })
  }
  dropUnbornNode(id:string) {
    this.unbornNodes = this.unbornNodes.filter((node) => {
      return node.id !== id
    })
  }
  get children() {
    return this.nodes
  }
}

class SparkplugData extends events.EventEmitter {
  public history:History
  private client?:ReturnType<typeof newHost>
  groups:SparkplugGroup[]
  autoRebirthInterval?: ReturnType<typeof setInterval>
  constructor() {
    super()
    this.groups = []
    this.history = new History(prisma)
  }
  async initialize({
    serverUrl,
    username,
    password,
  }:{
    serverUrl:string,
    username:string,
    password:string,
  }) {
    this.groups = []
    if (this.client) {
      this.client.stop()
      this.client = undefined
    }
    this.client = newHost({
      serverUrl,
      username,
      password,
      clientId: process.env.MANTLE_CLIENT_ID || `mantle-${uuidv4()}`,
      primaryHostId: process.env.MANTLE_MQTTPRIMARYHOSTID || `mantle-${uuidv4()}`,
    })
    this.createEvents()
    this.emit('update',this.groups)
    this.client.publishHostOnline()
  }
  createEvents() {
    this.client!.on('nbirth',(topic, groupId, nodeId, payload) => {
      let group = this.getGroup(groupId)
      if (group) {
        // Clear matching unborn nodes first
        group.dropUnbornNode(nodeId)
        let node = group.getNode(nodeId)
        if (node) {
          node = new SparkplugNode({ id:nodeId, timestamp:payload.timestamp })
        } else {
          node = new SparkplugNode({ id:nodeId, timestamp:payload.timestamp })
          group.nodes.push(node)
        }
        node.updateMetrics({ groupId, nodeId }, this.history!, payload)
        log.info(`Node ${node.id} is born in group ${group.id}.`)
      } else {
        group = new SparkplugGroup({ id:groupId, timestamp:payload.timestamp })
        this.groups.push(group)
        const node = new SparkplugNode({ id:nodeId, timestamp:payload.timestamp })
        group.nodes.push(node)
        node.updateMetrics({ groupId, nodeId }, this.history!, payload)
        log.info(`Node ${node.id} is born as part of new group ${group.id}.`)
      }
      this.emit('update',this.groups)
    })
    this.client!.on('dbirth',(_topic, groupId, nodeId, deviceId, payload) => {
      let group = this.getGroup(groupId)
      if (group) {
        let node = group.getNode(nodeId)
        if (node) {
          node.dropUnbornDevice(deviceId)
          if (payload.timestamp) {
            node.updatedOn = new Date(payload.timestamp.toString())
          }
          let device = node.getDevice(deviceId)
          if (device) {
            device = new SparkplugDevice({ id:deviceId, timestamp:payload.timestamp })
          } else {
            device = new SparkplugDevice({ id:deviceId, timestamp:payload.timestamp })
            node.devices.push(device)
          }
          device.updateMetrics({ groupId, nodeId, deviceId }, this.history!, payload)
          log.info(`Device ${device.id} is born to Node ${node.id} in group ${group.id}.`)
        } else {
          node = group.getUnbornNode(nodeId)
          if (node) {
            node.dropUnbornDevice(deviceId)
            if (payload.timestamp) {
              node.updatedOn = new Date(payload.timestamp.toString())
            }
            let device = node.getDevice(deviceId)
            if (device) {
              device = new SparkplugDevice({ id:deviceId, timestamp:payload.timestamp })
            } else {
              device = new SparkplugDevice({ id:deviceId, timestamp:payload.timestamp })
              node.devices.push(device)
            }
          } else {
            node = new SparkplugNode({ id:nodeId, timestamp:payload.timestamp })
            group.unbornNodes.push(node)
            let device = new SparkplugDevice({ id:deviceId, timestamp:payload.timestamp })
            node.devices.push(device)
            device.updateMetrics({ groupId, nodeId, deviceId }, this.history!, payload)
            log.info(`Device ${device.id} is born to unborn Node ${node.id} in group ${group.id}.`)
          }
        }
      } else {
        group = new SparkplugGroup({ id:groupId, timestamp:payload.timestamp })
        this.groups.push(group)
        const node = new SparkplugNode({ id:nodeId, timestamp:payload.timestamp })
        group.unbornNodes.push(node)
        let device = new SparkplugDevice({ id:deviceId, timestamp:payload.timestamp })
        node.devices.push(device)
        device.updateMetrics({ groupId, nodeId, deviceId }, this.history!, payload)
        log.info(`Device ${device.id} is born to unborn Node ${node.id} in new group ${group.id}.`)
      }
      this.emit('update',this.groups)
    })
    this.client!.on('ddata',(_topic, groupId, nodeId, deviceId, payload) => {
      let group = this.getGroup(groupId)
      if (group) {
        let node = group.getNode(nodeId)
        if (node) {
          if (payload.timestamp) {
            node.updatedOn = new Date(payload.timestamp.toString())
          }
          let device = node.getDevice(deviceId)
          if (device) {
            log.info(`Received data for ${device.id} in Node ${node.id} in Group ${group.id}:`)
            device.updateMetrics({ groupId, nodeId, deviceId }, this.history!, payload)
          } else {
            device = new SparkplugDevice({ id:deviceId, timestamp:payload.timestamp })
            node.unbornDevices.push(device)
            device.updateMetrics({ groupId, nodeId, deviceId }, this.history!, payload)
            log.info(`Received data for unborn device ${device.id} in Node ${node.id} in ${group.id}`)
          }
        } else {
          node = group.getUnbornNode(nodeId)
          if (node) {
            let device = node.getDevice(deviceId)
            if (device) {
              log.info(`Received data for ${device.id} in Node ${node.id} in Group ${group.id}:`)
              device.updateMetrics({ groupId, nodeId, deviceId }, this.history!, payload)
            } else {
              device = node.getUnbornDevice(deviceId)
              if (device) {
                device.updateMetrics({ groupId, nodeId, deviceId }, this.history!, payload)
              } else {
                device = new SparkplugDevice({ id:deviceId, timestamp:payload.timestamp })
                node.unbornDevices.push(device)
                device.updateMetrics({ groupId, nodeId, deviceId }, this.history!, payload)
              }
              log.info(`Received data for unborn device ${device.id} in Node ${node.id} in ${group.id}`)
            }
          } else {
            node = new SparkplugNode({ id:nodeId, timestamp:payload.timestamp })
            group.unbornNodes.push(node)
            let device = new SparkplugDevice({ id:deviceId, timestamp:payload.timestamp })
            node.unbornDevices.push(device)
            device.updateMetrics({ groupId, nodeId, deviceId }, this.history!, payload)
            log.info(`Received data for unborn device ${device.id} in unborn Node ${node.id} in group ${group.id}.`)
          }
        }
      } else {
        group = new SparkplugGroup({ id:groupId, timestamp:payload.timestamp })
        this.groups.push(group)
        const node = new SparkplugNode({ id:nodeId, timestamp:payload.timestamp })
        group.unbornNodes.push(node)
        let device = new SparkplugDevice({ id:deviceId, timestamp:payload.timestamp })
        node.unbornDevices.push(device)
        device.updateMetrics({ groupId, nodeId, deviceId }, this.history!, payload)
        log.info(`Received data for unborn device ${device.id} in unborn Node ${node.id} in new group ${group.id}.`)
      }
      this.emit('update',this.groups)
    })
    this.client!.on('ndeath',(_topic, groupId, nodeId, _payload) => {
      let group = this.getGroup(groupId)
      if (group) {
        group.dropNode(nodeId)
        group.dropUnbornNode(nodeId)
      }
      log.info(`Node ${nodeId} is dead on group ${groupId}`)
      this.emit('update',this.groups)
    })
    this.client!.on('ddeath',(_topic, groupId, nodeId, deviceId, _payload) => {
      let group = this.getGroup(groupId)
      if (group) {
        let node = group.getNode(nodeId)
        if (node) {
          node.dropDevice(deviceId)
          node.dropUnbornDevice(deviceId)
        }
      }
      log.info(`Device ${deviceId} is dead on node ${nodeId} in group ${groupId}`)
      this.emit('update',this.groups)
    })
    this.client!.on('connect',() => {
      console.log('connecting')
      this.client!.publishHostOnline()
    })
    this.client!.on('reconnect',() => {
      console.log('reconnecting')
    })
    this.client!.on('error',(error) => {
      console.log(error.message)
    })
    this.client!.on('ncmd',(payload) => {
      console.log(payload)
    })
    this.client!.on('message',(topic, payload) => {
      console.log(`received message on topic "${topic}" with payload "${JSON.stringify(payload,null,4)}"`)
    })
    this.client!.on('offline',() => {
      console.log('offline')
      this.client!.publishHostOffline()
    })
  }
  getGroup(id:string) {
    return this.groups.find((group) => id === group.id)
  }
  requestRebirth({ groupId, nodeId }:{ groupId:string, nodeId:string }) {
    const payload:UPayload = {
      timestamp: new Date().getTime(),
      metrics: [{
        name: "Node Control/Rebirth",
        value: true,
        type: "Boolean",
        timestamp: new Date().getTime(),
        properties: {}
      }]
    }
    this.client?.publishNodeCommand(groupId, nodeId, payload)
  }
  sendNodeCommand({ groupId, nodeId, metricId, value }:{ groupId:string, nodeId:string, metricId:string, value:any }) {
    const metric = this.getGroup(groupId)?.getNode(nodeId)?.getMetric(metricId)
    if (metric) {
      const payload:UPayload = {
        timestamp: new Date().getTime(),
        metrics: [{
          ...metric,
          value
        }]
      }
      this.client?.publishNodeCommand(groupId, nodeId, payload)
    }
  }
  sendDeviceCommand({ groupId, nodeId, deviceId, metricId, value }:{ groupId:string, nodeId:string, deviceId:string, metricId:string, value:any }) {
    const metric = this.getGroup(groupId)?.getNode(nodeId)?.getDevice(deviceId)?.getMetric(metricId)
    if (metric) {
      const payload:UPayload = {
        timestamp: new Date().getTime(),
        metrics: [{
          ...metric,
          value: JSON.stringify(value)
        }]
      }
      this.client?.publishDeviceCommand(groupId, nodeId, deviceId, payload)
    }
  }
  startAutoRebirth(rate:number = 10000) {
    this.autoRebirthInterval = setInterval(() => {
      this.groups.forEach((group) => {
        group.unbornNodes.forEach((node) => {
          this.requestRebirth({ groupId:group.id, nodeId:node.id })
        })
      })
    }, rate)
  }
  stopAutoRebirth() {
    clearInterval(this.autoRebirthInterval)
  }
}

export const spdata:SparkplugData = new SparkplugData()