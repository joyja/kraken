import { describe, expect, it } from 'vitest'
import {
  addHandler,
  createMqttSource,
  readStore,
  subscribeAndStore
} from './mqttSource.js'

import * as R from 'ramda'
import { withNumber, withPersistent } from './variables.js'

const deriveHumidity = R.pipe(
  R.slice(0, 4) as (x: string) => string,
  (hex: string) => parseInt(hex, 16),
  R.divide(R.__, 10)
)

const deriveTemperature = R.pipe(
  R.slice(9, 12) as (x: string) => string,
  (hex: string) => parseInt(hex, 16),
  R.divide(R.__, 10)
)

const iolinkMqttInput = [
  {
    id: 'EBOX_HTR_H',
    description: 'iolinkMqtt',
    topic: 'instruments/ebox_htr_ht',
    onResponse: deriveHumidity
  },
  {
    id: 'EBOX_HTR_T',
    description: 'iolinkMqtt',
    topic: 'instruments/ebox_htr_ht',
    onResponse: deriveTemperature
  }
]

const getValueOrPath = R.curry((valuePath, obj) => {
  return R.isNil(valuePath) ? obj : R.path(valuePath, obj)
})

export const iolinkMqttConfigBase = ({
  id,
  description,
  topic,
  onResponse
}: {
  id: string
  description: string
  topic: string
  onResponse?: (value: any) => number | boolean | string
}) => ({
  id,
  description,
  source: {
    type: 'mqtt',
    name: 'local',
    valuePath: [
      'data',
      'payload',
      '/iolinkmaster/port[1]/iolinkdevice/pdin',
      'data'
    ],
    topic,
    onResponse
  }
})

export const iolinkMqttConfigBases = R.map(
  iolinkMqttConfigBase,
  iolinkMqttInput
)

//@ts-expect-error see next line
//TODO: investigate Ramda type error
const withPersistentNumber = R.pipe(withNumber, withPersistent)

export const iolinkMqttVariables = R.pipe(
  R.unnest,
  R.indexBy(R.prop('id'))
)([R.map(withPersistentNumber, iolinkMqttConfigBases)])

export const variables = R.mergeAll([iolinkMqttVariables])

describe('createMqttSource', () => {
  const client = createMqttSource('mqtt://localhost:1883')
  it('creates an mqtt client', async () => {
    expect(client.connected).toBe(false)
    await new Promise((resolve) => {
      client.on('connect', resolve)
    })
    expect(client.connected).toBe(true)
  })
  it('subscribes and stores', async () => {
    const topics: string[] = R.pipe(
      R.values,
      R.map(R.path(['source', 'topic'])),
      R.uniq
    )(variables) as string[]
    expect(topics).toEqual(['instruments/ebox_htr_ht'])
    const store: { [topic: string]: Buffer } = {}
    await new Promise((resolve) => {
      subscribeAndStore(topics, store, client)
      addHandler(() => {
        resolve(store)
      }, client)
    })
    expect(store).not.toEqual({})

    expect(variables).toMatchObject({
      EBOX_HTR_H: {
        datatype: 'number',
        decimals: 1,
        description: 'iolinkMqtt',
        id: 'EBOX_HTR_H',
        initialValue: 0,
        persistent: true,
        source: {
          name: 'local',
          onResponse: deriveHumidity,
          topic: 'instruments/ebox_htr_ht',
          type: 'mqtt',
          valuePath: [
            'data',
            'payload',
            '/iolinkmaster/port[1]/iolinkdevice/pdin',
            'data'
          ]
        }
      },
      EBOX_HTR_T: {
        datatype: 'number',
        decimals: 1,
        description: 'iolinkMqtt',
        id: 'EBOX_HTR_T',
        initialValue: 0,
        persistent: true,
        source: {
          name: 'local',
          onResponse: deriveTemperature,
          topic: 'instruments/ebox_htr_ht',
          type: 'mqtt',
          valuePath: [
            'data',
            'payload',
            '/iolinkmaster/port[1]/iolinkdevice/pdin',
            'data'
          ]
        }
      }
    })

    const values = R.pipe(
      R.values,
      R.map(
        (variable: {
          source: {
            topic: string
            valuePath: string[]
            onResponse: (...args: any[]) => number
          }
        }) => {
          const { topic, valuePath, onResponse } = variable.source
          const value = readStore(topic, store)
          return R.pipe(R.path(valuePath), onResponse)(value)
        }
      )
    )(variables)
    expect(values).toBeInstanceOf(Array)
    expect(values).toHaveLength(2)
  })
})
