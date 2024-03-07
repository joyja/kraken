import { plc } from "../../plc"
import _ from 'lodash'

export function setValue(root:unknown, args:{value:string, variablePath:string}) {
  const variable = _.get(plc.global, args.variablePath)
  if (variable !== undefined) {
    if (typeof variable == 'boolean') {
      _.set(plc.global, args.variablePath, args.value === 'true')
    }
    return {
      path: args.variablePath,
      value: args.value,
      datatype: typeof variable,
    }
  } else {
    throw Error(`${args.variablePath} does not exits.`)
  }
}

export function runFunction(args:{functionPath:string, args:string[]}) {
  const func = _.get(plc.global, args.functionPath)
  if (func !== undefined) {
    if (typeof func === 'function') {
      const functionPathParts = args.functionPath.split('.')
      const functionName = functionPathParts.pop()
      const parent = _.get(plc.global, functionPathParts.join('.'))
      if (func.length === 0 && functionName) {
        parent[functionName]()
      } else if (functionName) {
        parent[functionName](...args.args)
      }
    } else {
      throw Error(`${args.functionPath} exists, but is not a function.`)
    }
  } else {
    throw Error(`${args.functionPath} does not exits.`)
  }
}

export function startPlc () {
  plc.start()
  return plc
}
export function stopPlc () {
  plc.stop()
  return plc
}
export function restartPlc () {
  plc.restart()
  return plc
}
