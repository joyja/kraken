import * as R from 'ramda'

import mqtt from 'mqtt'

export const createMqttSource = (endpoint: string) => mqtt.connect(endpoint)

export const subscribe = R.curry(
  (
    topic: string,
    handler: (...args: any[]) => void | undefined,
    client: mqtt.MqttClient
  ) => {
    client.subscribe(topic, handler)
    return client
  }
)

export const addHandler = R.curry(
  (handler: (...args: any[]) => void, client: mqtt.MqttClient) => {
    client.on('message', handler)
    return client
  }
)

export const subscribeAndStore = R.curry(
  (
    topics: string[],
    store: { [topic: string]: Buffer },
    client: mqtt.MqttClient
  ) =>
    R.map((topic: string) => {
      R.pipe(
        //TODO: investigate Ramda type error
        // @ts-expect-error see prev line
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
