export interface SparkplugMetricHistory {
  value: string
  timestamp: Date
}

export interface SparkplugMetric {
  id: string
  value: string
  history: SparkplugMetricHistory[]
}

export interface SparkplugDevice {
  id: string
  metrics: SparkplugMetric[]
}

export interface SparkplugNode {
  id: string
  devices: [SparkplugDevice!]!
  metrics: SparkplugMetric[]
}

export interface SparkplugGroup {
  id: string
  nodes: SparkplugNode[]
  unbornNodes: SparkplugNode[]
  heirarchy: RestructuredNode
}

export interface RestructuredNode {
  id: string
  name: string
  value?: number
  nodeType?: 'group' | 'node' | 'device' | 'metric'
  children?: RestructuredNode[]
}

export interface SparkplugMetricUpdate {
  groupId: string
  nodeId: string
  deviceId: string
  metricId: string
  value: string
  timestamp: Date
}

//Charts
export type Series = {
  id: string
  name: string
  color: string
  data: DataPoint[]
}
export type DataPoint = {
  x: number | Date
  y: number
}
export type Axis = {
  min: number
  max: number
}
