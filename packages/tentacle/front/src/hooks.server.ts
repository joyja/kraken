import { sendRequest } from '$lib/graphql/request';
import * as query from '$lib/graphql/query';
import type { Handle } from '@sveltejs/kit';
import EventSource from 'eventsource';
import { env } from '$env/dynamic/private';
import { Effect, Schedule, pipe } from 'effect';
import { variableEvents } from '$lib/variables';

const policy = Schedule.fixed("1000 millis")

const getValues = Effect.tryPromise(async () => 
  sendRequest({
    query: query.values
  })
    .then(res => res.data?.values)
)

const getVariableValues = (varValues:any) => Effect.tryPromise(() => {
  return sendRequest({
      query: query.variables
    })
    .then(res => {
      const result = res.data?.variables.map((variable:{datatype:string, name:string, children:{name:string, value:{path:string}}[]}) => {
        const atomicTypes = ['string', 'boolean', 'number']
        const contextParams:{[key:string]:string | number | boolean | undefined} = {}
        if (atomicTypes.includes(variable.datatype)) {
          const value = varValues.find((value:{path:string}) => value.path === variable.name)
          if (value) {
            if (value.datatype === 'string' && value.value.includes('function')) {
              contextParams.datatype = 'function'
              contextParams.argumentCount = parseInt(value.value.replace('function',''))
            } else {
              contextParams.datatype = value.datatype
              contextParams.value = value.value
            }
          }
          contextParams.path = value?.path
        } else {
          const children = variable.children.map((child:{name:string, value:{path:string}, datatype?:string}) => {
            const value = varValues.find((value:{path:string}) => value.path === `${variable.name}.${child.name}`)?.value
            return {
              ...child,
              value
            }
          })
          const values = varValues
            .filter((value:{path:string}) => value.path.split('.')[0] === variable.name)
            .map((value:{path:string,datatype:string,value:string}) => {
              const child = children.find((child:{name:string}) => child.name === value.path.split('.').slice(1).join('.')) 
              return {
                name: value.path.split('.').slice(1).join('.'),
                path: value.path,
                datatype: child?.datatype ? child.datatype : value.datatype,
                value: value.value,
                ...child
              }
            })
          contextParams.values = values
        }
        return {
          ...variable,
          ...contextParams,
        }
      })
      return result
    })
  }
)

const tentacleStatus = {
  connected: false
}
const getVariablesTest = pipe(getValues, Effect.andThen(getVariableValues))
const retryGetVariables = Effect.retry(getVariablesTest, policy)

let variablesResolved = false
let variables:Promise<{name:string, value:string}[]> = Effect.runPromise(retryGetVariables).then((res) => {
  tentacleStatus.connected = true
  variablesResolved = true
  return res
})
let taskMetrics:{task:string, functionExecutionTime:number, intervalExecutionTime:number, totalScanTime:number}[] = []
let changes:{timestamp:string, path:string, event:string}[] = []

declare global {
  //eslint-disable-next-line no-var
  var sources: EventSource[]
}

function generateSources () {
  const protocol = env.TENTACLE_PROTOCOL || 'http'
  const host = env.TENTACLE_HOST || 'localhost'
  const port = env.TENTACLE_PORT || '4000'
  const end = env.TENTACLE_URL || '/graphql'
  const root = `${protocol}://${host}:${port}${end}`
  const subscriptions = [{
    query: `subscription { 
      values { 
        name
        value
        timestamp
        type  
      } 
    }`,
    action: async ({ data }:{data:string}) => {
      if (variablesResolved) {
        const variablesResult = await variables
        const values = JSON.parse(data).data.values
        variablesResult.forEach((variable:{name: string, value:string}) => {
          values.forEach((value:{name:string, value:string}) => {
            if (variable.name === value.name) {
              variable.value = value.value
            }
          })
        })
      }
      tentacleStatus.connected = true
      variableEvents.emit('change')
    }
  },{
    query: `subscription { 
      taskMetrics { 
        task
        totalScanTime
        functionExecutionTime
        overheadExecutionTime
        intervalExecutionTime
      } 
    }`,
    action: async ({ data }:{data:string}) => {
      taskMetrics = JSON.parse(data).data.taskMetrics
    }
  },{
    query: `subscription { 
      changes {
        timestamp
        event
        path
      } 
    }`,
    action: async ({ data }:{data:string}) => {
      changes = JSON.parse(data).data.changes
    }
  },{
    query: `subscription { 
      plc {
        running
      } 
    }`,
    action: async ({ data }:{data:string}) => {
      if (JSON.parse(data).data.plc.running) {
        variables = await Effect.runPromise(retryGetVariables)
        variableEvents.emit('change')
      }
    }
  }]
  globalThis.sources = subscriptions.map((subscription) => {
    const source = new EventSource(`${root}?query=${subscription.query}`)
    source.addEventListener('next', subscription.action)
    source.addEventListener('error', (e) => {
      tentacleStatus.connected = false
      console.error(e);
    });
    return source
  })
}

if (globalThis.sources && globalThis.sources.length > 0) {
  globalThis.sources.forEach((source) => {
    source.close()
  })
  globalThis.sources = []
}

generateSources()

export const handle:Handle = async ({ event, resolve }) => {
  const theme = event.cookies.get('theme') ?? 'themeLight';
  if (variablesResolved) {
    event.locals.variables = await variables
  } else {
    event.locals.variables = []
  }
  event.locals.metrics = taskMetrics
  event.locals.changes = changes
  event.locals.tentacleStatus = tentacleStatus
  return resolve(event,{
    transformPageChunk: ({ html }) => html.replace('%theme%', theme),
  })
}