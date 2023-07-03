import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import events from 'events';

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

  sp.on('update',(groups:SparkplugGroup[]) => {
    mainWindow.webContents.send('update-groups', groups)
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
app.whenReady().then(() => {
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

class SparkplugData extends events.EventEmitter {
  client:ReturnType<typeof newHost>
  groups:SparkplugGroup[]
  constructor() {
    super()
    this.groups = []
    this.client = newHost({
      serverUrl: 'ssl://mqtt.anywherescada.com',
      username: 'joyja',
      password: 'pLLJtj1txGZ4JdrrF2OS',
      clientId: 'pangolin-nautilus-dev1',
      primaryHostId: 'pangolin-nautilus-dev1'
    })
    this.client.on('nbirth',(_topic, groupId, nodeId, payload) => {
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
    this.client.on('dbirth',(_topic, groupId, nodeId, deviceId, payload) => {
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
      this.emit('update',this.groups)
    })
    this.client.on('ddata',(_topic, groupId, nodeId, deviceId, payload) => {
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
      this.emit('update',this.groups)
    })
    this.client.on('ndeath',(_topic, groupId, nodeId, _payload) => {
      let group = this.getGroup(groupId)
      if (group) {
        group.dropNode(nodeId)
        group.dropUnbornNode(nodeId)
      }
      log.info(`Node ${nodeId} is dead on group ${groupId}`)
      this.emit('update',this.groups)
    })
    this.client.on('ddeath',(_topic, groupId, nodeId, deviceId, _payload) => {
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
  }
  getGroup(id:string) {
    return this.groups.find((group) => id === group.id)
  }
}

const sp = new SparkplugData()

