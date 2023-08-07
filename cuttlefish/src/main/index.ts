import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import events from 'events'
import { UTemplate } from 'kraken-sparkplug-client'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4} from 'uuid'

const USER_DATA_PATH = path.join(app.getPath("userData"), 'user_data.json')

function readUserData() {
  try {
      const data = fs.readFileSync(USER_DATA_PATH, 'utf-8')
      return JSON.parse(data)
  } catch(error) {
    if (error instanceof Error) {
      writeUserData({"connections":[]})
    } else {
      console.log('Error retrieving user data', error)  
      // you may want to propagate the error, up to you
      return null
    }
  }
}

function writeUserData(data) {
  fs.writeFileSync(USER_DATA_PATH, JSON.stringify(data))
}

function getConnections() {
  const userData = readUserData()
  let connections
  if (userData.connections) {
    connections = userData.connections
  } else {
    connections = []
    userData.connections = connections
    writeUserData(userData)
  }
  return userData.connections
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  ipcMain.handle('getConnections', getConnections)
  
  spdata.on('update',(groups:SparkplugGroup[]) => {
    mainWindow.webContents.send('update-groups', groups)
  })

  ipcMain.on('addConnection', (_event, connection) => {
    const connections = getConnections()
    connections.push(connection)
    writeUserData({ connections })
  })

  ipcMain.on('selectConnection', (_event, id) => {
    const connections = getConnections()
    const connection = connections.find(c => c.id === id)
    if (connection) {
      spdata.initialize(connection)
    }
  })

  ipcMain.on('deleteConnection', (_event, id) => {
    const connections = getConnections()
    writeUserData({ 
      connections: connections.filter(connection => connection.id !== id)
    })
  })

  ipcMain.on('requestRebirth', (_event, { groupId, nodeId }) => {
    spdata.requestRebirth({ groupId, nodeId })
  })

  ipcMain.on('sendNodeCommand', (_event, { groupId, nodeId, metricId, value }) => {
    spdata.sendNodeCommand({ groupId, nodeId, metricId, value })
  })

  ipcMain.on('sendDeviceCommand', (_event, { groupId, nodeId, deviceId, metricId, value }) => {
    spdata.sendDeviceCommand({ groupId, nodeId, deviceId, metricId, value })
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  await startMqtt()
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
import { UPayload } from 'kraken-sparkplug-client'
import { newHost } from 'kraken-sparkplug-client'
import { Log } from './log'

const log = new Log()
type Unpacked<T> = T extends (infer U)[] ? U : T

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
  updateMetrics(payload:UPayload | UTemplate) {
    if (payload.metrics) {
      for(const payloadMetric of payload.metrics) {
        if (payloadMetric.name) {
          let metric = this.getMetric(payloadMetric.name)
          if (metric) {
            metric.update(payloadMetric)
          } else {
            metric = new SparkplugMetric({ id: payloadMetric.name, timestamp: payloadMetric.timestamp, ...payloadMetric } )
            this.metrics.push(metric)
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

interface SparkplugMetric extends NonNullable<Unpacked<UPayload['metrics']>> {
  updateCount:number
}
interface SparkplugMetricInit extends NonNullable<Unpacked<UPayload['metrics']>> {
  id:string,
  timestamp?:Unpacked<UPayload>['timestamp']
}

class SparkplugMetric extends SparkplugBasicMetrics {
  public updateCount = 0
  constructor(init:SparkplugMetricInit) {
    super(init)
    Object.assign(this, { ...init, timestamp:this.timestamp })
  }
  update(update:NonNullable<Unpacked<UPayload['metrics']>>) {
    Object.assign(this, { ...update, })
    this.updateCount += 1
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
  private client?:ReturnType<typeof newHost>
  groups:SparkplugGroup[]
  constructor() {
    super()
    this.groups = []
  }
  initialize({
    serverUrl,
    username,
    password,
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
      clientId: `cuttlefish-${uuidv4()}`,
      primaryHostId: `cuttlefish-${uuidv4()}`,
    })
    this.createEvents()
    this.emit('update',this.groups)
  }
  createEvents() {
    this.client!.on('nbirth',(_topic, groupId, nodeId, payload) => {
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
          device.updateMetrics(payload)
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
            device.updateMetrics(payload)
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
        device.updateMetrics(payload)
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
            device.updateMetrics(payload)
          } else {
            device = new SparkplugDevice({ id:deviceId, timestamp:payload.timestamp })
            node.unbornDevices.push(device)
            device.updateMetrics(payload)
            log.info(`Received data for unborn device ${device.id} in Node ${node.id} in ${group.id}`)
          }
        } else {
          node = group.getUnbornNode(nodeId)
          if (node) {
            let device = node.getDevice(deviceId)
            if (device) {
              log.info(`Received data for ${device.id} in Node ${node.id} in Group ${group.id}:`)
              device.updateMetrics(payload)
            } else {
              device = node.getUnbornDevice(deviceId)
              if (device) {
                device.updateMetrics(payload)
              } else {
                device = new SparkplugDevice({ id:deviceId, timestamp:payload.timestamp })
                node.unbornDevices.push(device)
                device.updateMetrics(payload)
              }
              log.info(`Received data for unborn device ${device.id} in Node ${node.id} in ${group.id}`)
            }
          } else {
            node = new SparkplugNode({ id:nodeId, timestamp:payload.timestamp })
            group.unbornNodes.push(node)
            let device = new SparkplugDevice({ id:deviceId, timestamp:payload.timestamp })
            node.unbornDevices.push(device)
            device.updateMetrics(payload)
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
        device.updateMetrics(payload)
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
    // console.log(`group ${groupId}`, `node ${nodeId}`, `device ${deviceId}`, `metric ${metricId}`)
    const metric = this.getGroup(groupId)?.getNode(nodeId)?.getDevice(deviceId)?.getMetric(metricId)
    console.log(value)
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
}

let spdata:SparkplugData = new SparkplugData()
async function startMqtt() {
  const connections = await getConnections()
  if (connections && connections.length > 0) {
    spdata.initialize(connections[0])
  }
}

