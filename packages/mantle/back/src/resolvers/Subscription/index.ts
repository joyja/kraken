import { pubsub } from '../../pubsub'
import type { SparkplugMetricUpdate } from '../types'

export const metricUpdate = {
  subscribe: () => pubsub.subscribe('metricUpdate'),
  resolve: (payload:SparkplugMetricUpdate[]) => payload
}