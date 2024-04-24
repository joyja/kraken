import type { SparkplugGroup } from '$lib/types'
import { writable, derived } from 'svelte/store'

type Group = {
  id: string
  nodes: Node[]
}

type Node = {
  id: string
  devices: Device[]
}

type Device = {
  id: string
  metrics: Metric[]
}

type Metric = {
  id: string
  value: string
  type: string
}

type RestructuredNode = {
  name: string
  nodeType?: 'group' | 'node' | 'device' | 'metric'
  value?: string | number
  children?: RestructuredNode[]
}

function restructureData(
  input: Group | Node | Device | Metric | (Group | Node | Device | Metric)[],
): RestructuredNode | RestructuredNode[] {
  if (Array.isArray(input)) {
    return input.map(restructureData) as RestructuredNode[]
  }

  const result: RestructuredNode = {
    name: input.id,
  }

  if ('nodes' in input) {
    result.nodeType = 'group'
    result.children = restructureData(input.nodes) as RestructuredNode[]
  } else if ('devices' in input) {
    result.nodeType = 'node'
    result.children = restructureData(input.devices) as RestructuredNode[]
  } else if ('metrics' in input) {
    result.nodeType = 'device'
    result.children = restructureData(input.metrics) as RestructuredNode[]
  } else if (!['Node Control', 'Device Control'].includes(input.type)) {
    result.nodeType = 'metric'
    result.value = 1
  }

  return result
}

function calculateTotalMetricsPerGroup(group: SparkplugGroup): number {
  let totalMetrics = 0

  // Iterate over each node in the group
  group.nodes.forEach((node) => {
    // Add the number of metrics directly under the node
    if (node.metrics) totalMetrics += node.metrics.length

    // Iterate over each device in the node
    node.devices.forEach((device) => {
      // Add the number of metrics for the device
      if (device.metrics) totalMetrics += device.metrics.length
    })
  })

  return totalMetrics
}

export const groups = writable<SparkplugGroup[]>([])

export const groupStatistics = derived(groups, ($groups) => {
  return $groups.reduce(
    (acc: { [groupId: string]: { totalMetrics: number } }, group) => {
      acc[group.id] = {
        totalMetrics: calculateTotalMetricsPerGroup(group),
      }
      return acc
    },
    {},
  )
})
