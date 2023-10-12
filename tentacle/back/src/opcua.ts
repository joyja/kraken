import {
  DataType,
  OPCUAClient,
  MessageSecurityMode,
  SecurityPolicy,
  AttributeIds,
  ClientSession
} from 'node-opcua'

import {
  NodeCrawler, NodeCrawlerClientSession,
} from 'node-opcua-client-crawler'

import { Log } from './log'

const log = new Log('OPCUA')
 
type ConstructorOptions = {
  initialDelay?: number
  maxRetry?: number
  applicationName?: string
  host: string
  port: number
  retryRate: number
}

type ReadOptions = {
  nodeId: string
}

type ReadManyOptions = {
  nodeIds: string[]
}

type WriteOptions = {
  inputValue: any
  nodeId: string
  registerType: string
}

type FlatResult = {
  nodeId: string
  browseName: string
}

export class Opcua {
  host: string
  port: number
  retryRate: number
  connected: boolean
  error: string | null
  retryCount: number
  nodes: any | null
  client: OPCUAClient
  session?: ClientSession
  retryInterval?: NodeJS.Timeout

  constructor({
    initialDelay = 1000,
    maxRetry = 1,
    applicationName = 'tentacle-plc',
    host,
    port,
    retryRate,
  }: ConstructorOptions) {
    this.host = host
    this.port = port
    this.retryRate = retryRate
    this.connected = false
    this.error = null
    this.retryCount = 0
    this.nodes = null
    const options = {
      applicationName,
      connectionStrategy: {
        initialDelay,
        maxRetry,
      },
      securityMode: MessageSecurityMode.None,
      securityPolicy: SecurityPolicy.None,
      endpointMustExist: false,
    }
    this.client = OPCUAClient.create(options)

    this.client.on('connection_failed', async () => {
      if (this.connected) {
        await this.disconnect()
        await this.connect()
      }
    })

    this.client.on('connection_lost', async () => {
      if (this.connected) {
        await this.disconnect()
        await this.connect()
      }
    })
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      this.error = null
      log.info(
        `Connecting to opcua device, host: ${this.host}, port: ${this.port}.`
      )
      await this.client
        .connect(`opc.tcp://${this.host}:${this.port}`)
        .catch((error) => {
          this.error = error.message
          this.connected = false
          if (!this.retryInterval) {
            this.retryInterval = setInterval(async () => {
              log.info(
                `Retrying connection to opcua device, retry attempts: ${this.retryCount}.`
              )
              this.retryCount += 1
              await this.connect()
            }, this.retryRate)
          }
        })
      if (!this.error) {
        this.retryCount = 0
        clearInterval(this.retryInterval)
        log.info(
          `Connected to opcua device, host: ${this.host}, port: ${this.port}.`
        )
        this.connected = true
        this.session = await this.client.createSession()
      } else {
        this.connected = false
        log.info(
          `Connection failed to opcua device, host: ${this.host}, port: ${this.port}, with error: ${this.error}.`
        )
      }
    }
  }

  async disconnect(): Promise<void> {
    this.retryCount = 0
    clearInterval(this.retryInterval)
    log.info(`Disconnecting from modbus device`)
    const logText = `Closed connection to modbus device.`
    if (this.connected) {
      await this.client.disconnect()
      log.info(logText)
    } else {
      log.info(logText)
    }
    this.connected = false
  }

  async browse(nodeId: string, flat = false): Promise<any> {
    if (this.connected) {
      return new Promise((resolve, reject) => {
        const crawler = new NodeCrawler(this.session!)
        let firstScan = true
        let flatResult:FlatResult[] = []
        if (flat) {
          crawler.on('browsed', (element) => {
            if (element.dataValue) {
              flatResult.push({
                nodeId: element.nodeId.toString(),
                browseName: `${element.nodeId.toString()},${
                  element.browseName.name
                }`,
              })
            }
          })
        }
        crawler.read(nodeId || 'ObjectsFolder', (err, obj) => {
          if (!err) {
            if (flat) {
              resolve(flatResult)
            } else {
              resolve(obj)
            }
          } else {
            reject(err)
          }
        })
      })
    } else {
      return flat ? [] : null
    }
  }

  async read({ nodeIds }: ReadManyOptions): Promise<any[] | undefined> {
    if (this.connected) {
      try {
        const results = await this.session!
          .read(nodeIds.map((nodeId) => {
            return {
              nodeId,
              attributeId: AttributeIds.Value
            }
          }))
          .catch((error) => console.error(error))
        return results?.map((result) => {
          return result.value.value
        })
      } catch (error) {
        console.error(error)
      }
    }
  }

  async write({ inputValue, nodeId, registerType }: WriteOptions): Promise<void> {
    if (this.connected) {
      let dataType
      let value
      if (registerType === 'BOOLEAN') {
        dataType = DataType.Boolean
        value = inputValue + '' === 'true'
      } else if (registerType === 'FLOAT') {
        dataType = DataType.Float
        value = parseFloat(inputValue)
      } else if (registerType === 'DOUBLE') {
        dataType = DataType.Double
        value = parseFloat(inputValue)
      } else if (registerType === 'INT16') {
        dataType = DataType.Int16
        value = parseInt(inputValue)
      } else if (registerType === 'INT32') {
        dataType = DataType.Int32
        value = parseInt(inputValue)
      } else {
        dataType = DataType.String
        value = inputValue
      }
      const nodeToWrite = {
        nodeId,
        attributeId: AttributeIds.Value,
        value: {
          value: {
            dataType,
            value
          }
        }
      }
      await this.session!.write(nodeToWrite)
        .catch((error) => console.error(error))
    }
  }
}
