import { pubsub } from '../../pubsub.js'
import type { TaskMetric, VariableValue } from '../../generated/graphql.js'

export const countdown = {
  // This will return the value on every 1 sec until it reaches 0
  subscribe: async function* (_: unknown, { from }: { from: number }) {
    for (let i = from; i >= 0; i--) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      yield { countdown: i }
    }
  },
}

export const values = {
  subscribe: () => pubsub.subscribe('values'),
  resolve: (payload: VariableValue) => payload,
}

export const taskMetrics = {
  subscribe: () => pubsub.subscribe('taskMetrics'),
  resolve: (payload: TaskMetric) => payload,
}

export const changes = {
  subscribe: () => pubsub.subscribe('fileChanges'),
  resolve: (payload: TaskMetric) => payload,
}

export const plc = {
  subscribe: () => pubsub.subscribe('plc'),
  resolve: (payload: boolean) => payload,
}
