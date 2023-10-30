import { denormalize } from "../../denormalize"
import { Config, TaskMetric } from "../../generated/graphql"
import { plc } from "../../plc"
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import { getAllFiles } from "../../recursiveReaddr"

export function info () { 
  return 'Tentacle: A modern soft PLC'
}

export function metrics():TaskMetric[] {
  return Object.keys(plc.metrics).map((key) => {
      return {
        task: key,
        ...plc.metrics[key],
      }
    })
}

export function configuration():Config {
  return {
      tasks: Object.keys(plc.config.tasks).map((key) => {
        return {
          name: key,
          description: plc.config.tasks[key].description
            ? plc.config.tasks[key].description
            : '',
          ...plc.config.tasks[key],
        }
      }),
      mqtt: Object.keys(plc.config.mqtt).map((key) => {
        return {
          name: key,
          description: plc.config.mqtt[key].description
            ? plc.config.mqtt[key].description
            : '',
          ...plc.config.mqtt[key],
        }
      }),
      modbus: Object.keys(plc.config.modbus).map((key) => {
        return {
          name: key,
          description: plc.config.modbus[key].description
            ? plc.config.modbus[key].description
            : '',
          ...plc.config.modbus[key],
        }
      }),
      opcua: Object.keys(plc.config.opcua).map((key) => {
        return {
          name: key,
          description: plc.config.opcua[key].description
            ? plc.config.opcua[key].description
            : '',
          ...plc.config.opcua[key],
        }
      }),
    }
}

export function value(root:unknown, args:{variablePath:string}) {
  const variable = _.get(plc.global, args.variablePath)
    if (variable !== undefined) {
      return {
        path: args.variablePath,
        value: variable,
        datatype: typeof variable,
      }
    } else {
      throw Error(`${args.variablePath} does not exits.`)
    }
}

export function values(root:unknown, args:{variablePaths:string[]}) {
  const values = denormalize(plc.global)
  return Object.keys(values).map((key) => {
    return {
      path: key,
      value: values[key],
      datatype: typeof values[key],
    }
  })
}

export function variables (root:unknown, args:unknown) {
  try {
    return Object.keys(plc.variables).map((key) => {
      const atomicDatatypes = ['string', 'boolean', 'number']
      let children = []
      if (!atomicDatatypes.includes(plc.variables[key].datatype)) {
        const variableClass = plc.classes.find(
          (item:{name:string}) => item.name === plc.variables[key].datatype
        )
        children = Object.keys(variableClass.variables).map((childKey) => {
          return {
            name: childKey,
            ...variableClass.variables[childKey],
          }
        })
      }
      return {
        name: key,
        description: plc.variables[key].description
          ? plc.variables[key].description
          : '',
        ...plc.variables[key],
        children,
      }
    })
  } catch (error) {
    console.log(error)
  }
}

export function program (args:{name:string}) {
  return fs.readFileSync(
    path.resolve(process.cwd(), 'runtime/programs', args.name),
    { encoding: 'utf8', flag: 'r' }
  )
}
export function programs () {
  const result = getAllFiles(
    path.resolve(process.cwd(), 'runtime/programs')
  ).map((file) => file.replace(`${process.cwd()}/runtime/programs/`, ''))
  return result
}
// export function tFunction () {
//   return fs
//     .readdirSync(path.resolve(process.cwd(), 'runtime/classes'))
//     .map((file) => file.replace(`${process.cwd()}/runtime/classes/`, ''))
// }
// export function tFunctions () {
//   return fs
//     .readdirSync(path.resolve(process.cwd(), 'runtime/functions'))
//     .map((file) => file.replace(`${process.cwd()}/runtime/functions/`, ''))
// }
export function tClass (args:{name:string}) {
  return fs.readFileSync(
    path.resolve(process.cwd(), 'runtime/classes', args.name),
    { encoding: 'utf8', flag: 'r' }
  )
}
export function tClasses () {
  return fs
    .readdirSync(path.resolve(process.cwd(), 'runtime/classes'))
    .map((file) => file.replace(`${process.cwd()}/runtime/classes/`, ''))
}
export function changes () {
  return plc.fileChanges
}
export function tPlc() {
  return plc
}