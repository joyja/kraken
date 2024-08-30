import * as R from 'ramda'

interface RestConfig {
  url: string
  valuePath?: string[]
  method: 'GET' | 'POST'
  onResponse?: (value: any) => number | boolean | string
  body?: (value: string | number | boolean) => object
}

const getValueOrPath = R.curry((valuePath, obj) => {
  return R.isNil(valuePath) ? obj : R.path(valuePath, obj)
})

export const get = (value: string | number | boolean, config: RestConfig) => {
  const options =
    config.method === 'POST'
      ? {
          method: config.method,
          body: JSON.stringify(config.body?.apply(null, [value]))
        }
      : undefined
  return fetch(config.url, options)
    .then((res) => {
      if (res.ok) {
        return res.json()
      } else {
        console.log(res)
      }
    })
    .then(getValueOrPath(config.valuePath))
    .then(config.onResponse)
    .catch((error) => {
      console.error(`error on ${config.url}`, error)
    })
}
