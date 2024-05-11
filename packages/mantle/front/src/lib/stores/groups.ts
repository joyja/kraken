import type { SparkplugGroup } from '$lib/types'
import { writable, derived } from 'svelte/store'

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
	return $groups.reduce((acc: { [groupId: string]: { totalMetrics: number } }, group) => {
		acc[group.id] = {
			totalMetrics: calculateTotalMetricsPerGroup(group)
		}
		return acc
	}, {})
})
