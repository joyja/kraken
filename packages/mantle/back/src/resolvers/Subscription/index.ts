import { filter, map, pipe } from 'graphql-yoga'
import { pubsub } from '../../pubsub.js'
import type { SparkplugMetricUpdate } from '../types.js'

function getPath(metric: SparkplugMetricUpdate):string {
	return `${metric.groupId}/${metric.nodeId}/${metric.deviceId}/${metric.metricId}`
}

export const metricUpdate = {
	subscribe: (_: unknown, args: { paths: string[] }) => {
		const { paths } = args
		if (paths != null) {
			return pipe(
				pubsub.subscribe('metricUpdate'),
				filter((publishedMetrics: SparkplugMetricUpdate[]) => {
					return paths.some((path) => {
						return publishedMetrics.some((metric) => {
							return getPath(metric) === path
						})
					})
				}),
				map((publishedMetrics: SparkplugMetricUpdate[]) => {
					return publishedMetrics.filter((metric) => {
						return paths.some((path) => {
							return getPath(metric) === path
						})
					})
				})
			)
		} else {
			return pubsub.subscribe('metricUpdate')
		}
	},
	resolve: (payload: SparkplugMetricUpdate[]) => payload
}
