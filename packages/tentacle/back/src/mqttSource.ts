import * as R from 'ramda'
import { type newClient } from 'kraken-sparkplug-client'

export type mqttClient = ReturnType<typeof newClient>

export const subscribe = R.curry(
  (
    topic: string,
    handler: (...args: any[]) => void | undefined,
    client: ReturnType<typeof newClient>['client']
  ) => {
    client.subscribe(topic, handler)
    return client
  }
)

export const addHandler = R.curry(
  (
    handler: (...args: any[]) => void,
    client: ReturnType<typeof newClient>['client']
  ) => {
    client.on('message', handler)
    return client
  }
)

export const subscribeAndStore = R.curry(
  (
    topics: string[],
    store: { [topic: string]: Buffer },
    client: ReturnType<typeof newClient>['client']
  ) =>
    R.map((topic: string) => {
      R.pipe(
        subscribe(topic, (err) => {
          if (err) console.log('Subscription Error', err)
        }),
        addHandler((topic: string, message: Buffer) => {
          store[topic] = message
        })
      )(client)
    })(topics)
)

export const readStore = (topic: string, store: { [topic: string]: Buffer }) =>
  JSON.parse(store[topic].toString())
