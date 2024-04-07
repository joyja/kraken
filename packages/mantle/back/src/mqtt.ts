import { newHost, type UPayload, type UTemplate } from 'kraken-sparkplug-client'
import { v4 as uuidv4 } from 'uuid'
import { History } from './history.js'
import events from 'events'
import { Log } from './log/index.js'
import { alarmHandler } from './alarm.js'
import { prisma } from './prisma.js'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { pubsub } from './pubsub.js'

const log = new Log('mqtt')
type Unpacked<T> = T extends Array<infer U> ? U : T

interface SparkplugBasicInit {
	id: string
	timestamp?: Unpacked<UPayload>['timestamp']
	unborn?: boolean
}

// Contains data that all sparkplug classes should have
class SparkplugBasic {
	id: string
	updatedOn: Date
	timestamp?: number | Long.Long | null
	constructor({ id, timestamp }: SparkplugBasicInit) {
		this.id = id
		this.timestamp = timestamp
		if (timestamp != null && typeof timestamp !== 'number') {
			this.updatedOn = new Date(timestamp.toNumber() * 1000)
		} else {
			this.updatedOn = timestamp != null ? new Date(timestamp * 1000) : new Date()
		}
	}
}

// For any sparkplug classes that have metrics
class SparkplugBasicMetrics extends SparkplugBasic {
	metrics: SparkplugMetric[]
	unborn = false
	constructor(init: SparkplugBasicInit) {
		super(init)
		this.metrics = []
		this.unborn = init.unborn ?? false
	}

	updateMetrics(
		{ groupId, nodeId, deviceId }: { groupId: string; nodeId: string; deviceId?: string },
		history: History,
		payload: UPayload | UTemplate
	): void {
		if (payload.metrics != null) {
			pubsub.publish(
				'metricUpdate',
				payload.metrics
					.filter((m) => m.name)
					.map((m) => ({
						groupId,
						nodeId,
						deviceId,
						metricId: m.name,
						timestamp: m.timestamp?.toString(),
						value: m.value
					}))
			)
			for (const payloadMetric of payload.metrics) {
				if (payloadMetric.name != null) {
					let metric = this.getMetric(payloadMetric.name)
					if (metric != null) {
						metric.update(payloadMetric)
					} else {
						metric = new SparkplugMetric({
							groupId,
							nodeId,
							deviceId,
							id: payloadMetric.name,
							timestamp: payloadMetric.timestamp,
							...payloadMetric
						})
						this.metrics.push(metric)
					}
					history.log(metric).catch((error) => {
						if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
							log.debug(`Unique constraint violation: ${JSON.stringify(error.meta?.target)}`)
						} else {
							// Handle or throw any other errors
							throw error
						}
					})
					if (alarmHandler != null && this.unborn !== true) {
						void alarmHandler.evaluateMetricAlarms({ path: {
							groupId,
							nodeId,
							deviceId,
							metricId: payloadMetric.name
						} })
					}
					log.debug(
						`Metric ${metric.id} updated to value ${JSON.stringify(payloadMetric.value, null, 4)}`
					)
				}
			}
		}
	}

	getMetric(id: string): SparkplugMetric | undefined {
		return this.metrics.find((metrics) => id === metrics.id)
	}
}

export type SparkplugMetricT = {
	updateCount: number
} & NonNullable<Unpacked<UPayload['metrics']>>
type SparkplugMetricInit = {
	id: string
	groupId: string
	nodeId: string
	deviceId?: string
	timestamp?: Unpacked<UPayload>['timestamp']
	type: string
	value: any
} & NonNullable<Unpacked<UPayload['metrics']>>

export class SparkplugMetric extends SparkplugBasicMetrics {
	public updateCount = 0
	public groupId: string
	public nodeId: string
	public deviceId?: string
	public type: string
	public value: any
	constructor(init: SparkplugMetricInit) {
		super(init)
		this.groupId = init.groupId
		this.nodeId = init.nodeId
		this.deviceId = init.deviceId
		this.type = init.type
		this.value = init.value
		Object.assign(this, { ...init, timestamp: this.timestamp })
	}

	update(update: NonNullable<Unpacked<UPayload['metrics']>>): void {
		Object.assign(this, { ...update })
		this.updateCount += 1
		if (update.timestamp != null && typeof update.timestamp !== 'number') {
			this.updatedOn = new Date(update.timestamp.toNumber() * 1000)
		} else {
			this.updatedOn = update.timestamp != null ? new Date(update.timestamp * 1000) : new Date()
		}
	}
}

class SparkplugDevice extends SparkplugBasicMetrics {

	get children(): SparkplugMetric[] {
		return this.metrics
	}
}

class SparkplugNode extends SparkplugBasicMetrics {
	devices: SparkplugDevice[]
	unbornDevices: SparkplugDevice[]
	constructor(init: SparkplugBasicInit) {
		super(init)
		this.devices = []
		this.unbornDevices = []
	}

	getDevice(id: string): SparkplugDevice | undefined {
		return this.devices.find((device) => id === device.id)
	}

	getUnbornDevice(id: string): SparkplugDevice | undefined {
		return this.unbornDevices.find((device) => id === device.id)
	}

	dropDevice(id: string): void {
		this.devices = this.devices.filter((device) => {
			return device.id !== id
		})
	}

	dropUnbornDevice(id: string): void {
		this.unbornDevices = this.unbornDevices.filter((device) => {
			return device.id !== id
		})
	}

	get children(): SparkplugDevice[] {
		return this.devices
	}
}

export class SparkplugGroup extends SparkplugBasic {
	nodes: SparkplugNode[]
	unbornNodes: SparkplugNode[]
	constructor(init: SparkplugBasicInit) {
		super(init)
		this.nodes = []
		this.unbornNodes = []
	}

	getNode(id: string): SparkplugNode | undefined {
		return this.nodes.find((node) => id === node.id)
	}

	getUnbornNode(id: string): SparkplugNode | undefined {
		return this.unbornNodes.find((node) => id === node.id)
	}

	dropNode(id: string): void {
		this.nodes = this.nodes.filter((node) => {
			return node.id !== id
		})
	}

	dropUnbornNode(id: string): void {
		this.unbornNodes = this.unbornNodes.filter((node) => {
			return node.id !== id
		})
	}

	get children(): SparkplugNode[] {
		return this.nodes
	}
}

class SparkplugData extends events.EventEmitter {
	public history: History
	private client?: ReturnType<typeof newHost>
	groups: SparkplugGroup[]
	autoRebirthInterval?: ReturnType<typeof setInterval>
	constructor() {
		super()
		this.groups = []
		this.history = new History(prisma)
	}

	async initialize({
		serverUrl,
		username,
		password
	}: {
		serverUrl: string
		username: string
		password: string
	}): Promise<void> {
		this.groups = []
		if (this.client != null) {
			this.client.stop()
			this.client = undefined
		}
		this.client = newHost({
			serverUrl,
			username,
			password,
			clientId: process.env.MANTLE_CLIENT_ID ?? `mantle-${uuidv4()}`,
			primaryHostId: process.env.MANTLE_MQTTPRIMARYHOSTID ?? `mantle-${uuidv4()}`
		})
		this.createEvents()
		this.emit('update', this.groups)
		this.client.publishHostOnline()
	}

	createEvents(): void {
		this.client?.on('nbirth', (topic, groupId, nodeId, payload) => {
			let group = this.getGroup(groupId)
			if (group != null) {
				// Clear matching unborn nodes first
				group.dropUnbornNode(nodeId)
				let node = group.getNode(nodeId)
				if (node != null) {
					node = new SparkplugNode({
						id: nodeId,
						timestamp: payload.timestamp
					})
				} else {
					node = new SparkplugNode({
						id: nodeId,
						timestamp: payload.timestamp
					})
					group.nodes.push(node)
				}
				node.updateMetrics({ groupId, nodeId }, this.history, payload)
				log.info(`Node ${node.id} is born in group ${group.id}.`)
			} else {
				group = new SparkplugGroup({
					id: groupId,
					timestamp: payload.timestamp
				})
				this.groups.push(group)
				const node = new SparkplugNode({
					id: nodeId,
					timestamp: payload.timestamp
				})
				group.nodes.push(node)
				node.updateMetrics({ groupId, nodeId }, this.history, payload)
				log.info(`Node ${node.id} is born as part of new group ${group.id}.`)
			}
			this.emit('update', this.groups)
		})
		this.client?.on('dbirth', (_topic, groupId, nodeId, deviceId, payload) => {
			let group = this.getGroup(groupId)
			if (group != null) {
				let node = group.getNode(nodeId)
				if (node != null) {
					node.dropUnbornDevice(deviceId)
					if (payload.timestamp != null) {
						node.updatedOn = new Date(payload.timestamp.toString())
					}
					let device = node.getDevice(deviceId)
					if (device != null) {
						device = new SparkplugDevice({
							id: deviceId,
							timestamp: payload.timestamp
						})
					} else {
						device = new SparkplugDevice({
							id: deviceId,
							timestamp: payload.timestamp
						})
						node.devices.push(device)
					}
					device.updateMetrics({ groupId, nodeId, deviceId }, this.history, payload)
					log.info(`Device ${device.id} is born to Node ${node.id} in group ${group.id}.`)
				} else {
					node = group.getUnbornNode(nodeId)
					if (node != null) {
						node.dropUnbornDevice(deviceId)
						if (payload.timestamp != null) {
							node.updatedOn = new Date(payload.timestamp.toString())
						}
						let device = node.getDevice(deviceId)
						if (device != null) {
							device = new SparkplugDevice({
								id: deviceId,
								timestamp: payload.timestamp
							})
						} else {
							device = new SparkplugDevice({
								id: deviceId,
								timestamp: payload.timestamp
							})
							node.devices.push(device)
						}
					} else {
						node = new SparkplugNode({
							id: nodeId,
							timestamp: payload.timestamp,
							unborn: true
						})
						group.unbornNodes.push(node)
						const device = new SparkplugDevice({
							id: deviceId,
							timestamp: payload.timestamp,
							unborn: true
						})
						node.devices.push(device)
						device.updateMetrics({ groupId, nodeId, deviceId }, this.history, payload)
						log.info(`Device ${device.id} is born to unborn Node ${node.id} in group ${group.id}.`)
					}
				}
			} else {
				group = new SparkplugGroup({
					id: groupId,
					timestamp: payload.timestamp
				})
				this.groups.push(group)
				const node = new SparkplugNode({
					id: nodeId,
					timestamp: payload.timestamp,
					unborn: true
				})
				group.unbornNodes.push(node)
				const device = new SparkplugDevice({
					id: deviceId,
					timestamp: payload.timestamp
				})
				node.devices.push(device)
				device.updateMetrics({ groupId, nodeId, deviceId }, this.history, payload)
				log.info(`Device ${device.id} is born to unborn Node ${node.id} in new group ${group.id}.`)
			}
			this.emit('update', this.groups)
		})
		this.client?.on('ddata', (_topic, groupId, nodeId, deviceId, payload) => {
			let group = this.getGroup(groupId)
			if (group != null) {
				let node = group.getNode(nodeId)
				if (node != null) {
					if (payload.timestamp != null) {
						node.updatedOn = new Date(payload.timestamp.toString())
					}
					let device = node.getDevice(deviceId)
					if (device != null) {
						log.debug(`Received data for ${device.id} in Node ${node.id} in Group ${group.id}:`)
						device.updateMetrics({ groupId, nodeId, deviceId }, this.history, payload)
					} else {
						device = new SparkplugDevice({
							id: deviceId,
							timestamp: payload.timestamp,
							unborn: true
						})
						node.unbornDevices.push(device)
						device.updateMetrics({ groupId, nodeId, deviceId }, this.history, payload)
						log.info(
							`Received data for unborn device ${device.id} in Node ${node.id} in ${group.id}`
						)
					}
				} else {
					node = group.getUnbornNode(nodeId)
					if (node != null) {
						let device = node.getDevice(deviceId)
						if (device != null) {
							log.info(`Received data for ${device.id} in Node ${node.id} in Group ${group.id}:`)
							device.updateMetrics({ groupId, nodeId, deviceId }, this.history, payload)
						} else {
							device = node.getUnbornDevice(deviceId)
							if (device != null) {
								device.updateMetrics({ groupId, nodeId, deviceId }, this.history, payload)
							} else {
								device = new SparkplugDevice({
									id: deviceId,
									timestamp: payload.timestamp,
									unborn: true
								})
								node.unbornDevices.push(device)
								device.updateMetrics({ groupId, nodeId, deviceId }, this.history, payload)
							}
							log.info(
								`Received data for unborn device ${device.id} in Node ${node.id} in ${group.id}`
							)
						}
					} else {
						node = new SparkplugNode({
							id: nodeId,
							timestamp: payload.timestamp,
							unborn: true
						})
						group.unbornNodes.push(node)
						const device = new SparkplugDevice({
							id: deviceId,
							timestamp: payload.timestamp,
							unborn: true
						})
						node.unbornDevices.push(device)
						device.updateMetrics({ groupId, nodeId, deviceId }, this.history, payload)
						log.info(
							`Received data for unborn device ${device.id} in unborn Node ${node.id} in group ${group.id}.`
						)
					}
				}
			} else {
				group = new SparkplugGroup({
					id: groupId,
					timestamp: payload.timestamp
				})
				this.groups.push(group)
				const node = new SparkplugNode({
					id: nodeId,
					timestamp: payload.timestamp,
					unborn: true
				})
				group.unbornNodes.push(node)
				const device = new SparkplugDevice({
					id: deviceId,
					timestamp: payload.timestamp,
					unborn: true
				})
				node.unbornDevices.push(device)
				device.updateMetrics({ groupId, nodeId, deviceId }, this.history, payload)
				log.info(
					`Received data for unborn device ${device.id} in unborn Node ${node.id} in new group ${group.id}.`
				)
			}
			this.emit('update', this.groups)
		})
		this.client?.on('ndeath', (_topic, groupId, nodeId) => {
			const group = this.getGroup(groupId)
			if (group != null) {
				group.dropNode(nodeId)
				group.dropUnbornNode(nodeId)
			}
			log.info(`Node ${nodeId} is dead on group ${groupId}`)
			this.emit('update', this.groups)
		})
		this.client?.on('ddeath', (_topic, groupId, nodeId, deviceId) => {
			const group = this.getGroup(groupId)
			if (group != null) {
				const node = group.getNode(nodeId)
				if (node != null) {
					node.dropDevice(deviceId)
					node.dropUnbornDevice(deviceId)
				}
			}
			log.info(`Device ${deviceId} is dead on node ${nodeId} in group ${groupId}`)
			this.emit('update', this.groups)
		})
		this.client?.on('connect', () => {
			log.info('Connected')
			this.client?.publishHostOnline()
		})
		this.client?.on('reconnect', () => {
			log.info('reconnecting')
		})
		this.client?.on('error', (error) => {
			log.info(error.message)
		})
		this.client?.on('ncmd', (payload) => {
			log.info(`Received node command with ${payload.metrics?.[0]?.name}`)
		})
		this.client?.on('message', (topic, payload) => {
			console.log(
				`received message on topic "${topic}" with payload "${JSON.stringify(payload, null, 4)}"`
			)
		})
		this.client?.on('offline', () => {
			console.log('offline')
			this.client?.publishHostOffline()
		})
	}

	getGroup(id: string): SparkplugGroup | undefined {
		return this.groups.find((group) => id === group.id)
	}

	getMetric({ groupId, nodeId, deviceId, metricId }:{groupId: string, nodeId: string, deviceId?: string | null, metricId: string}): SparkplugMetric | undefined {
		if (deviceId != null ) {
			return this.getGroup(groupId)?.getNode(nodeId)?.getDevice(deviceId)?.getMetric(metricId)
		} else {
			return this.getGroup(groupId)?.getNode(nodeId)?.getMetric(metricId)
		}
	}

	requestRebirth({ groupId, nodeId }: { groupId: string; nodeId: string }): void {
		const payload: UPayload = {
			timestamp: new Date().getTime(),
			metrics: [
				{
					name: 'Node Control/Rebirth',
					value: true,
					type: 'Boolean',
					timestamp: new Date().getTime(),
					properties: {}
				}
			]
		}
		this.client?.publishNodeCommand(groupId, nodeId, payload)
	}

	sendNodeCommand({
		groupId,
		nodeId,
		metricId,
		value
	}: {
		groupId: string
		nodeId: string
		metricId: string
		value: any
	}): void {
		const metric = this.getGroup(groupId)?.getNode(nodeId)?.getMetric(metricId)
		if (metric != null) {
			const payload: UPayload = {
				timestamp: new Date().getTime(),
				metrics: [
					{
						...metric,
						type: 'Boolean',
						value
					}
				]
			}
			this.client?.publishNodeCommand(groupId, nodeId, payload)
		}
	}

	sendDeviceCommand({
		groupId,
		nodeId,
		deviceId,
		metricId,
		value
	}: {
		groupId: string
		nodeId: string
		deviceId: string
		metricId: string
		value: any
	}): void {
		const metric = this.getGroup(groupId)?.getNode(nodeId)?.getDevice(deviceId)?.getMetric(metricId)
		if (metric != null) {
			const payload: UPayload = {
				timestamp: new Date().getTime(),
				metrics: [
					{
						...metric,
						type: 'Boolean',
						value: JSON.stringify(value)
					}
				]
			}
			this.client?.publishDeviceCommand(groupId, nodeId, deviceId, payload)
		}
	}

	startAutoRebirth(rate: number = 10000):void {
		this.autoRebirthInterval = setInterval(() => {
			this.groups.forEach((group) => {
				group.unbornNodes.forEach((node) => {
					this.requestRebirth({ groupId: group.id, nodeId: node.id })
				})
			})
		}, rate)
	}

	stopAutoRebirth():void {
		clearInterval(this.autoRebirthInterval)
	}
}

export const spdata: SparkplugData = new SparkplugData()
