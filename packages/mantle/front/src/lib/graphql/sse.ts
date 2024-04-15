import EventSource from 'eventsource'
import { env } from '$env/dynamic/private'

declare global {
  //eslint-disable-next-line no-var
  var sources: EventSource[]
}

interface subscription {
  query: string
  action: (event: MessageEvent) => void
}

export function generateSources({
  subscriptions,
}: {
  subscriptions: subscription[]
}) {
  const protocol = env.MANTLE_PROTOCOL || 'http'
  const host = env.MANTLE_HOST || 'localhost'
  const port = env.MANTLE_PORT || '4000'
  const end = env.MANTLE_URL || '/graphql'
  const root = `${protocol}://${host}:${port}${end}`
  globalThis.sources = subscriptions.map((subscription) => {
    const source = new EventSource(`${root}?query=${subscription.query}`)
    source.addEventListener('next', subscription.action)
    source.addEventListener('error', (e) => {
      console.error(e)
    })
    return source
  })
}

export function clearSources() {
  if (globalThis.sources && globalThis.sources.length > 0) {
    globalThis.sources.forEach((source) => {
      source.close()
    })
    globalThis.sources = []
  }
}
