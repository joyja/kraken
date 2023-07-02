import { UPayload } from 'kraken-sparkplug-client'
import { time } from 'systeminformation';
import { newHost, UTemplate } from '../sparkplug-client/index'
import { Log } from './log'

const log = new Log()
type Unpacked<T> = T extends (infer U)[] ? U : T;

interface SparkplugBasicInit { id:string, timestamp?:Unpacked<UPayload>['timestamp'] }

//Contains data that all sparkplug classes should have
class SparkplugBasic {
  id:string
  updatedOn:Date
  timestamp?:number | Long.Long | null
  constructor({ id, timestamp }:SparkplugBasicInit) {
    this.id = id
    this.timestamp = timestamp
    if (timestamp && typeof timestamp !== 'number') {
      this.updatedOn = new Date(timestamp.toNumber())
    } else {
      this.updatedOn = timestamp ? new Date(timestamp) : new Date()
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
  updateMetrics(payload:UPayload) {
    if (payload.metrics) {
      for(const payloadMetric of payload.metrics) {
        if (payloadMetric.name) {
          let metric = this.getMetric(payloadMetric.name)
          if (metric) {
            metric.update(payloadMetric)
            log.info(`Metric ${metric.id} updated to value ${JSON.stringify(payloadMetric.value, null, 4)}`)
          } else {
            metric = new SparkplugMetric({ id: payloadMetric.name, timestamp: payloadMetric.timestamp, ...payloadMetric } )
            this.metrics.push(metric)
          }
        }
      }
    }
  }
  getMetric(id:string) {
    return this.metrics.find((metrics) => id === metrics.id )
  }
}

interface SparkplugMetric extends NonNullable<Unpacked<UPayload['metrics']>> {}
interface SparkplugMetricInit extends NonNullable<Unpacked<UPayload['metrics']>> {
  id:string,
  timestamp?:Unpacked<UPayload>['timestamp']
}

class SparkplugMetric extends SparkplugBasicMetrics {
  constructor(init:SparkplugMetricInit) {
    super(init)
    Object.assign(this, { ...init, timestamp:this.timestamp })
  }
  update(update:NonNullable<Unpacked<UPayload['metrics']>>) {
    Object.assign(this, update)
  }
}

class SparkplugDevice extends SparkplugBasicMetrics {
  constructor(init:SparkplugBasicInit) {
    super(init)
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
}

class SparkplugData {
  client:ReturnType<typeof newHost>
  groups:SparkplugGroup[]
  constructor() {
    this.groups = []
    this.client = newHost({
      serverUrl: 'ssl://mqtt.anywherescada.com',
      username: 'joyja',
      password: 'pLLJtj1txGZ4JdrrF2OS',
      clientId: 'pangolin-nautilus-dev1',
      primaryHostId: 'pangolin-nautilus-dev1'
    })
    this.client.on('nbirth',(topic, groupId, nodeId, payload) => {
      // console.log(JSON.stringify(payload,null,4))
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
        node.updateMetrics(payload)
        log.info(`Node ${node.id} is born in group ${group.id}.`)
      } else {
        group = new SparkplugGroup({ id:groupId, timestamp:payload.timestamp })
        this.groups.push(group)
        const node = new SparkplugNode({ id:nodeId, timestamp:payload.timestamp })
        group.nodes.push(node)
        node.updateMetrics(payload)
        log.info(`Node ${node.id} is born as part of new group ${group.id}.`)
      }
    })
    this.client.on('dbirth',(topic, groupId, nodeId, deviceId, payload) => {
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
          device.updateMetrics(payload)
          log.info(`Device ${device.id} is born to Node ${node.id} in group ${group.id}.`)
        } else {
          const node = new SparkplugNode({ id:nodeId, timestamp:payload.timestamp })
          group.unbornNodes.push(node)
          let device = new SparkplugDevice({ id:deviceId, timestamp:payload.timestamp })
          node.devices.push(device)
          device.updateMetrics(payload)
          log.info(`Device ${device.id} is born to unborn Node ${node.id} in group ${group.id}.`)
        }
      } else {
        group = new SparkplugGroup({ id:groupId, timestamp:payload.timestamp })
        this.groups.push(group)
        const node = new SparkplugNode({ id:nodeId, timestamp:payload.timestamp })
        group.unbornNodes.push(node)
        let device = new SparkplugDevice({ id:deviceId, timestamp:payload.timestamp })
        node.devices.push(device)
        device.updateMetrics(payload)
        log.info(`Device ${device.id} is born to unborn Node ${node.id} in new group ${group.id}.`)
      }
    })
    this.client.on('ddata',(topic, groupId, nodeId, deviceId, payload) => {
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
            device.updateMetrics(payload)
          } else {
            device = new SparkplugDevice({ id:deviceId, timestamp:payload.timestamp })
            node.unbornDevices.push(device)
            device.updateMetrics(payload)
            log.info(`Received data for unborn device ${device.id} in Node ${node.id} in ${group.id}`)
          }
        } else {
          const node = new SparkplugNode({ id:nodeId, timestamp:payload.timestamp })
          group.unbornNodes.push(node)
          let device = new SparkplugDevice({ id:deviceId, timestamp:payload.timestamp })
          node.unbornDevices.push(device)
          device.updateMetrics(payload)
          log.info(`Received data for unborn device ${device.id} in unborn Node ${node.id} in group ${group.id}.`)
        }
      } else {
        group = new SparkplugGroup({ id:groupId, timestamp:payload.timestamp })
        this.groups.push(group)
        const node = new SparkplugNode({ id:nodeId, timestamp:payload.timestamp })
        group.unbornNodes.push(node)
        let device = new SparkplugDevice({ id:deviceId, timestamp:payload.timestamp })
        node.unbornDevices.push(device)
        device.updateMetrics(payload)
        log.info(`Received data for unborn device ${device.id} in unborn Node ${node.id} in new group ${group.id}.`)
      }
      log.info(JSON.stringify(this.groups,null,4))
    })
    this.client.on('ndeath',(topic, groupId, nodeId, payload) => {
      let group = this.getGroup(groupId)
      if (group) {
        group.dropNode(nodeId)
        group.dropUnbornNode(nodeId)
      }
      log.info(`Node ${nodeId} is dead on group ${groupId}`)
    })
    this.client.on('ddeath',(topic, groupId, nodeId, deviceId, payload) => {
      let group = this.getGroup(groupId)
      if (group) {
        let node = group.getNode(nodeId)
        if (node) {
          node.dropDevice(deviceId)
          node.dropUnbornDevice(deviceId)
        }
      }
      log.info(`Device ${deviceId} is dead on node ${nodeId} in group ${groupId}`)
    })
  }
  getGroup(id:string) {
    return this.groups.find((group) => id === group.id)
  }
}

const sp = new SparkplugData()


