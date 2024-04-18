/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import {
	DataType,
	OPCUAClient,
	MessageSecurityMode,
	SecurityPolicy,
	AttributeIds,
	type ClientSession,
	DataValue
} from 'node-opcua'

import { NodeCrawler } from 'node-opcua-client-crawler'

import { Log } from 'coral'

const log = new Log('OPCUA')

interface ConstructorOptions {
	initialDelay?: number
	maxRetry?: number
	applicationName?: string
	host: string
	port: number
	retryRate: number
}

interface ReadManyOptions {
	nodeIds: string[]
}

interface WriteOptions {
	inputValue: any
	nodeId: string
	registerType: string
}

interface FlatResult {
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
		retryRate
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
				maxRetry
			},
			securityMode: MessageSecurityMode.None,
			securityPolicy: SecurityPolicy.None,
			endpointMustExist: false
		}
		this.client = OPCUAClient.create(options)

		this.client.on('connection_failed', () => {
			if (this.connected) {
				void this.disconnect().then(() => {
					void this.connect()
				})
			}
		})

		this.client.on('connection_lost', () => {
			if (this.connected) {
				void this.disconnect().then(() => {
					void this.connect()
				})
			}
		})
	}

	async connect(): Promise<void> {
		if (!this.connected) {
			this.error = null
			log.info(`Connecting to opcua device, host: ${this.host}, port: ${this.port}.`)
			await this.client.connect(`opc.tcp://${this.host}:${this.port}`).catch((error) => {
				this.error = error.message
				this.connected = false
				if (!this.retryInterval) {
					this.retryInterval = setInterval(() => {
						log.info(`Retrying connection to opcua device, retry attempts: ${this.retryCount}.`)
						this.retryCount += 1
						void this.connect()
					}, this.retryRate)
				}
			})
			if (!this.error !== null) {
				this.retryCount = 0
				clearInterval(this.retryInterval)
				log.info(`Connected to opcua device, host: ${this.host}, port: ${this.port}.`)
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
			return await new Promise((resolve, reject) => {
				if(!this.session) {
					reject(new Error('No session'))
					return
				}
				const crawler = new NodeCrawler(this.session)
				const flatResult: FlatResult[] = []
				if (flat) {
					crawler.on('browsed', (element) => {
						if (element.dataValue) {
							flatResult.push({
								nodeId: element.nodeId.toString(),
								browseName: `${element.nodeId.toString()},${element.browseName.name}`
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


	async readMany({ nodeIds }: ReadManyOptions): Promise<any[] | undefined>{
    if (this.connected) {
      try {
        // Function to split array into chunks
        const chunkArray = (arr:string[], chunkSize:number) => {
          const chunks = [];
          for (let i = 0; i < arr.length; i += chunkSize) {
            chunks.push(arr.slice(i, i + chunkSize));
          }
          return chunks;
        };
  
        // Splitting nodeIds into chunks of 50
        const nodeIdChunks = chunkArray(nodeIds, 50);
				let allResults:DataValue[] = [];
				
        // Processing each chunk
        for (const chunk of nodeIdChunks) {
          const results = await this.session
            ?.read(chunk.map((nodeId) => {
              return {
                nodeId,
                attributeId: AttributeIds.Value
              };
            }))
            .catch((error) => console.error(error));
  
          if (results) {
            allResults = allResults.concat(results.map((result) => result.value.value));
          }
        }
  
        return allResults;
      } catch (error) {
        console.error(error);
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
			await this.session?.write(nodeToWrite).catch((error) => { console.error(error); })
		}
	}
}
