import { denormalize } from '../../denormalize.js'
import {
  type MemoryUsage,
  type Config,
  type TaskMetric,
} from '../../generated/graphql.js'
import { type PLC, plc } from '../../plc.js'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import { getAllFiles } from '../../recursiveReaddr.js'

export function info(): string {
  return 'Tentacle: A modern soft PLC'
}

export function metrics(): TaskMetric[] {
  return Object.keys(plc.metrics).map((key) => {
    return {
      task: key,
      ...plc.metrics[key],
    }
  })
}

export function configuration(): Config {
  return {
    tasks: Object.keys(plc.config.tasks).map((key) => {
      return {
        name: key,
        description:
          plc?.config?.tasks[key]?.description !== null &&
          plc?.config?.tasks[key]?.description !== undefined
            ? plc.config.tasks[key].description
            : '',
        ...plc.config.tasks[key],
      }
    }),
    mqtt: Object.keys(plc.config.mqtt).map((key) => {
      return {
        name: key,
        description:
          plc?.config?.mqtt[key]?.description !== null &&
          plc?.config?.mqtt[key]?.description !== undefined
            ? plc.config.mqtt[key].description
            : '',
        ...plc.config.mqtt[key],
      }
    }),
    modbus: Object.keys(plc.config.modbus).map((key) => {
      return {
        name: key,
        description:
          plc.config.modbus[key].description !== null &&
          plc?.config?.modbus[key]?.description !== undefined
            ? plc.config.modbus[key].description
            : '',
        ...plc.config.modbus[key],
      }
    }),
    opcua: Object.keys(plc.config.opcua).map((key) => {
      return {
        name: key,
        description:
          plc.config.opcua[key].description !== null &&
          plc?.config?.opcua[key]?.description !== undefined
            ? plc.config.opcua[key].description
            : '',
        ...plc.config.opcua[key],
      }
    }),
  }
}

export function value(
  root: unknown,
  args: { variablePath: string },
): { path: string; value: string; datatype: string } {
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

export function values(): Array<{
  path: string
  value: string
  datatype: string
}> {
  const values = denormalize(plc.global)
  return Object.keys(values).map((key) => {
    return {
      path: key,
      value: JSON.stringify(values[key]),
      datatype: typeof values[key],
    }
  })
}

export function variables(): Array<{
  name: string
  description: string
  datatype: string
  children: Array<{ name: string; description: string; datatype: string }>
}> {
  return Object.keys(plc.variables).map((key) => {
    const atomicDatatypes = ['string', 'boolean', 'number']
    let children = []
    if (!atomicDatatypes.includes(plc.variables[key].datatype)) {
      const variableClass = plc.classes.find(
        (item: { name: string }) => item.name === plc.variables[key].datatype,
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
      description:
        plc?.variables[key]?.description !== null &&
        plc?.variables[key]?.description !== undefined
          ? plc.variables[key].description
          : '',
      ...plc.variables[key],
      children,
    }
  })
}

export function program(_root: unknown, args: { name: string }): string {
  return fs.readFileSync(
    path.resolve(process.cwd(), 'development/programs', args.name),
    { encoding: 'utf8', flag: 'r' },
  )
}
export function programs(): string[] {
  const result = getAllFiles(
    path.resolve(process.cwd(), 'development/programs'),
  ).map((file) => file.replace(`${process.cwd()}/development/programs/`, ''))
  return result
}
export function tClass(args: { name: string }): string {
  return fs.readFileSync(
    path.resolve(process.cwd(), 'development/classes', args.name),
    { encoding: 'utf8', flag: 'r' },
  )
}
export function tClasses(): string[] {
  return fs
    .readdirSync(path.resolve(process.cwd(), 'development/classes'))
    .map((file) => file.replace(`${process.cwd()}/development/classes/`, ''))
}
export function changes(): any[] {
  return plc.fileChanges
}
export function tPlc(): PLC {
  return plc
}

export function memoryUsage(): MemoryUsage {
  return process.memoryUsage()
}
