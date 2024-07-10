import ModbusRTU from 'modbus-serial'
import { Log } from 'coral'

const log = new Log('modbus')

interface ConstructorOptions {
  unitId?: number
  host: string
  port: number
  reverseBits?: boolean
  reverseWords?: boolean
  zeroBased?: boolean
  retryRate?: number
}

interface ReadOptions {
  registerType: 'INPUT_REGISTER' | 'HOLDING_REGISTER' | 'COIL' | 'INPUT'
  register: number
  format: 'FLOAT' | 'INT32' | 'INT16' | 'OTHER'
}

interface WriteOptions {
  value: any
  registerType: 'HOLDING_REGISTER' | 'COIL'
  register: number
  format: 'FLOAT' | 'INT32'
}

export class Modbus {
  host: string
  reverseBits: boolean
  reverseWords: boolean
  zeroBased: boolean
  retryRate: number
  connected: boolean
  error: string | null
  retryCount: number
  retryInterval?: NodeJS.Timeout
  client: ModbusRTU.default
  constructor({
    host,
    port,
    reverseBits = false,
    reverseWords = false,
    zeroBased = false,
    retryRate = 2000
  }: ConstructorOptions) {
    this.host = host
    this.port = port
    this.reverseBits = reverseBits
    this.reverseWords = reverseWords
    this.zeroBased = zeroBased
    this.retryRate = retryRate
    this.connected = false
    this.error = null
    this.retryCount = 0
    this.client = new ModbusRTU.default()
  }

  formatValue(data: number[], format: string): any {
    const buffer = new ArrayBuffer(4)
    const view = new DataView(buffer)
    let value: any = null
    if (format === `FLOAT`) {
      view.setUint16(0, this.reverseWords ? data[1] : data[0], this.reverseBits)
      view.setUint16(2, this.reverseWords ? data[0] : data[1], this.reverseBits)
      value = view.getFloat32(0)
    } else if (format === `INT32`) {
      view.setInt16(0, this.reverseWords ? data[1] : data[0], this.reverseBits)
      view.setInt16(2, this.reverseWords ? data[0] : data[1], this.reverseBits)
      value = view.getInt32(0)
    } else if (format === `INT16`) {
      view.setInt16(0, data[0], this.reverseBits)
      value = view.getInt16(0)
    } else {
      value = data
    }
    return value
  }

  formatOutput(value: number, format: string): number[] {
    const buffer = new ArrayBuffer(4)
    const view = new DataView(buffer)
    const data: number[] = []
    if (format === `FLOAT`) {
      view.setFloat32(0, value)
      data.push(view.getUint16(this.reverseWords ? 2 : 0, this.reverseBits))
      data.push(view.getUint16(this.reverseWords ? 0 : 2, this.reverseBits))
    } else if (format === `INT32`) {
      view.setInt32(0, value)
      data.push(view.getUint16(this.reverseWords ? 0 : 2, !this.reverseBits))
      data.push(view.getUint16(this.reverseWords ? 2 : 0, !this.reverseBits))
    }
    return data
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      this.error = null
      log.info(
        `Connecting to modbus device, host: ${this.host}, port: ${this.port}.`
      )
      await this.client
        .connectTCP(this.host, { port: this.port })
        .catch((error) => {
          this.error = error.message
          this.connected = false
          if (this.retryInterval === null || this.retryInterval === undefined) {
            this.retryInterval = setInterval(() => {
              log.info(
                `Retrying connection to modbus device, retry attempts: ${this.retryCount}.`
              )
              this.retryCount += 1
              void this.connect()
            }, this.retryRate)
          }
        })
      if (this.error === null || this.error === undefined) {
        this.retryCount = 0
        clearInterval(this.retryInterval)
        log.info(
          `Connected to modbus device, host: ${this.host}, port: ${this.port}.`
        )
        this.connected = true
      } else {
        this.connected = false
        log.warn(
          `Connection failed to modbus device, host: ${this.host}, port: ${this.port}.`
        )
      }
    }
  }

  async disconnect(): Promise<void> {
    await new Promise<void>((resolve) => {
      this.retryCount = 0
      clearInterval(this.retryInterval)
      log.info(
        `Disconnecting from modbus device, host: ${this.host}, port: ${this.port}.`
      )
      const logText = `Closed connection to modbus device, host: ${this.host}, port: ${this.port}.`
      if (this.connected) {
        this.client.close(() => {})
        log.info(logText)
        resolve()
      } else {
        log.info(logText)
        resolve()
      }
    })
    this.connected = false
  }

  async read({ registerType, register, format }: ReadOptions): Promise<any> {
    if (this.connected) {
      if (registerType === 'INPUT_REGISTER') {
        const quantity = format === 'INT16' ? 1 : 2
        await this.client
          .readInputRegisters(
            !this.zeroBased ? register - 1 : register,
            quantity
          )
          .then((data) => this.formatValue(data.data, format))
          .catch(async (error) => {
            if (
              error.name === 'TransactionTimedOutError' ||
              error.name === 'PortNotOpenError'
            ) {
              log.warn(`Connection Timed Out on device: ${error.name}`)
              await this.disconnect()
              await this.connect()
            } else {
              log.error(error)
            }
          })
      } else if (registerType === 'HOLDING_REGISTER') {
        const quantity = format === 'INT16' ? 1 : 2
        return await this.client
          .readHoldingRegisters(register, quantity)
          .then((data) => this.formatValue(data.data, format))
          .catch(async (error) => {
            if (error.name === 'TransactionTimedOutError') {
              await this.disconnect()
              await this.connect()
            } else {
              log.error(error)
            }
          })
      } else if (registerType === 'INPUT') {
        const quantity = 1
        return await this.client
          .readDiscreteInputs(register, quantity)
          .then((data) => data.data[0])
          .catch(async (error) => {
            if (error.name === 'TransactionTimedOutError') {
              await this.disconnect()
              await this.connect()
            } else {
              log.error(error)
            }
          })
      } else if (registerType === 'COIL') {
        const quantity = 1
        return await this.client
          .readCoils(register, quantity)
          .then((data) => data.data[0])
          .catch(async (error) => {
            if (error.name === 'TransactionTimedOutError') {
              await this.disconnect()
              await this.connect()
            } else {
              log.error(error)
            }
          })
      }
    }
  }

  async write({
    value,
    registerType,
    register,
    format
  }: WriteOptions): Promise<void> {
    if (this.connected) {
      if (registerType === 'HOLDING_REGISTER') {
        this.client
          .writeRegisters(register, this.formatOutput(value, format))
          .catch(async (error) => {
            if (error.name === 'TransactionTimedOutError') {
              await this.disconnect()
              await this.connect()
            } else {
              throw error
            }
          })
      } else if (registerType === 'COIL') {
        if (Object.prototype.toString.call(value) === '[object Array]') {
          this.client
            .writeCoils(
              register,
              value.map((item: boolean | string) => `${item}` === 'true')
            )
            .catch(async (error) => {
              if (error.name === 'TransactionTimedOutError') {
                await this.disconnect()
                await this.connect()
              } else {
                throw error
              }
            })
        } else {
          this.client
            .writeCoil(register, `${value}` === 'true')
            .catch(async (error) => {
              if (error.name === 'TransactionTimedOutError') {
                await this.disconnect()
                await this.connect()
              } else {
                throw error
              }
            })
        }
      }
    }
  }
}
