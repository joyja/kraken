import * as R from 'ramda'

export const taplog = (...args: any[]) => console.log(...args)

export const setKeyIf = R.curry((pred, key, value, obj) =>
  R.when(
    R.always(pred(value)), // Check if the variable exists (is not undefined or null)
    R.assoc(key, value) // If it exists, set the key
  )(obj)
)

export const setKeyWhenDefined = setKeyIf(
  (value: string) => value !== undefined && value !== null
)

export const withBoolean = R.mergeDeepRight({
  datatype: 'boolean',
  initialValue: false
})
export const withNumber = R.mergeDeepRight({
  datatype: 'number',
  initialValue: 0,
  decimals: 1
})
export const withNoDecimals = R.assoc('decimals', 0)
export const withOneDecimal = R.assoc('decimals', 1)
export const withTwoDecimals = R.assoc('decimals', 2)
export const withPersistent = R.assoc('persistent', true)

export const withModbusSource = R.mergeDeepRight({
  source: {
    type: 'modbus',
    bidirectional: false,
    rate: 500
  }
})

export const withModbusSourceHoldingRegisters = R.mergeDeepRight({
  source: {
    params: {
      registerType: 'HOLDING_REGISTER',
      format: 'INT16'
    }
  }
})

export const withModbusSourceInputRegisters = R.mergeDeepRight({
  source: {
    params: {
      registerType: 'HOLDING_REGISTER',
      format: 'INT16'
    }
  }
})

export const withModbusSourceInt16 = R.assocPath(
  ['source', 'params', 'format'],
  'INT16'
)
export const withModbusSourceFloat = R.assocPath(
  ['source', 'params', 'format'],
  'FLOAT'
)

export const withBidirectional = R.mergeDeepRight({
  source: {
    bidirectional: true
  }
})

//@ts-expect-error see next line
//TODO: investigate Ramda type error
export const formatModbusSourceHoldingRegisters = R.pipe(
  withNumber,
  withModbusSource,
  withModbusSourceHoldingRegisters
)
export const formatModbusSourceInputRegisters = R.pipe(
  withNumber,
  withModbusSource,
  withModbusSourceInputRegisters,
  withModbusSourceFloat
)

export const deriveInput = (list: object[]) =>
  //@ts-expect-error see next line
  //TODO: investigate Ramda type error
  R.pipe(
    //@ts-expect-error see next line
    //TODO: investigate Ramda type error
    R.reduce(R.xprod, R.head(list)),
    R.map(R.pipe(R.flatten, R.mergeAll))
  )(R.tail(list))
