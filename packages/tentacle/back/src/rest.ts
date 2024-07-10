import * as R from 'ramda'

interface RestConfig {
  url: string
  valuePath?: string[]
  onResponse?: (value: any) => number | boolean | string
}

const getValueOrPath = R.curry((valuePath, obj) => {
  return R.isNil(valuePath) ? obj : R.path(valuePath, obj)
})

export const get = (config: RestConfig) => {
  return fetch(config.url)
    .then((res) => res.json())
    .then(getValueOrPath(config.valuePath))
    .then(config.onResponse)
    .catch((error) => {
      console.error(`error on ${config.url}`, error)
    })
}
