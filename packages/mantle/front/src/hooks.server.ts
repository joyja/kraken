import type { Handle } from '@sveltejs/kit'
import { generateSources } from '$lib/graphql/sse'
import { sendRequest } from '$lib/graphql/request'
import * as query from '$lib/graphql/query'
import type { SparkplugGroup, SparkplugMetricUpdate } from '$lib/types'

async function getGroups(): Promise<SparkplugGroup[]> {
  return await sendRequest({
    query: query.groups,
  }).then((res: { groups: SparkplugGroup[] }) => res.groups)
}

const groupsPromise = getGroups()

let groups: SparkplugGroup[]

const subscriptions = [
  {
    query: `subscription { 
    metricUpdate {
      groupId
      nodeId
      deviceId
      metricId
      timestamp
      value
      updatesInLastMinute
      updatesInLastHour
      updatesInLastDay
    }
  }`,
    action: async ({ data }: { data: string }) => {
      if (groups) {
        const metricUpdates: SparkplugMetricUpdate[] =
          JSON.parse(data).data?.metricUpdate
        if (metricUpdates != null) {
          metricUpdates.forEach((metricUpdate) => {
            const group = groups.find(
              (group) => group.id === metricUpdate.groupId,
            )
            if (group) {
              const node = group.nodes.find(
                (node) => node.id === metricUpdate.nodeId,
              )
              if (node) {
                const device = node.devices.find(
                  (device) => device.id === metricUpdate.deviceId,
                )
                if (device) {
                  const metric = device.metrics.find(
                    (metric) => metric.id === metricUpdate.metricId,
                  )
                  if (metric) {
                    metric.value = metricUpdate.value
                    metric.history = [...metric.history, metricUpdate]
                  }
                }
              }
            }
          })
        }
      }
    },
  },
]

generateSources({ subscriptions })

export const handle: Handle = async ({ event, resolve }) => {
  const theme = event.cookies.get('theme') ?? 'themeLight'
  groups = await groupsPromise
  event.locals.groups = groups
  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%theme%', theme),
  })
}
