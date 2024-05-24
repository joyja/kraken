import { plc, type PLC } from '../../plc.js'
import _ from 'lodash'

export function setValue(root:unknown, args:{value:string, variablePath:string}):{path:string, value:string, datatype:string} {
  const variable = _.get(plc.variables, args.variablePath)
  const global = _.get(plc.global, args.variablePath)
  if (variable !== undefined && global !== undefined) {
    if (variable.datatype == 'boolean') {
      _.set(plc.global, args.variablePath, args.value === 'true')
    } else if (variable.datatype == 'number') {
      _.set(plc.global, args.variablePath, parseFloat(args.value))
    } else {
      _.set(plc.global, args.variablePath, args.value)
    }
    return {
      path: args.variablePath,
      value: args.value,
      datatype: variable.datatype,
    }
  } else {
    throw Error(`${args.variablePath} does not exits.`)
  }
}

export function runFunction(args: {
  functionPath: string
  args: string[]
}): void {
  const func = _.get(plc.global, args.functionPath)
  if (func !== undefined) {
    if (typeof func === 'function') {
      const functionPathParts = args.functionPath.split('.')
      const functionName = functionPathParts.pop()
      const parent = _.get(plc.global, functionPathParts.join('.'))
      if (
        func.length === 0 &&
        functionName !== null &&
        functionName !== undefined
      ) {
        parent[functionName]()
      } else if (functionName !== null && functionName !== undefined) {
        parent[functionName](...args.args)
      }
    } else {
      throw Error(`${args.functionPath} exists, but is not a function.`)
    }
  } else {
    throw Error(`${args.functionPath} does not exits.`)
  }
}

export function startPlc(): PLC {
  void plc.start()
  return plc
}
export function stopPlc(): PLC {
  plc.stop()
  return plc
}
export function restartPlc(): PLC {
  plc.restart()
  return plc
}
