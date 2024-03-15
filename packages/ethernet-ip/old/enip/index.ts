import { Socket, isIPv4 } from 'net'
import { EIP_PORT } from '../config'
import * as encapsulation from './encapsulation'
import * as CIP from './cip'
import { promiseTimeout } from '../utilities'
import { lookup } from 'dns'

type WriteCipCallback = (err?: Error | undefined) => void

interface State {
  TCP: {
    establishing: boolean
    established: boolean
  }
  session: {
    id: number | null
    establishing: boolean
    established: boolean
  }
  connection: {
    id: number | null
    establishing: boolean
    established: boolean
    seq_num: number
  }
  error: {
    code: number | null
    msg: string | null
  }
}

class ENIP {
  private readonly state: State
  private readonly socket: Socket

  constructor() {
    this.socket = new Socket()
    this.state = {
      TCP: { establishing: false, established: false },
      session: { id: null, establishing: false, established: false },
      connection: {
        id: null,
        establishing: false,
        established: false,
        seq_num: 0,
      },
      error: { code: null, msg: null },
    }

    this._initializeEventHandlers()
  }

  get error(): { code: number | null; msg: string | null } {
    return this.state.error
  }

  get establishing(): boolean {
    return this.state.session.establishing
  }

  get established(): boolean {
    return this.state.session.established
  }

  get session_id(): number | null {
    return this.state.session.id
  }

  async connect(IP_ADDR: string): Promise<number | null> {
    if (IP_ADDR.length === 0) {
      throw new Error('Controller <class> requires IP_ADDR <string>!!!')
    }
    await new Promise<void>((resolve, reject) => {
      lookup(IP_ADDR, (err, addr) => {
        if (err != null)
          reject(new Error('DNS Lookup failed for IP_ADDR ' + IP_ADDR))

        if (!isIPv4(addr)) {
          reject(
            new Error('Invalid IP_ADDR <string> passed to Controller <class>'),
          )
        }
        resolve()
      })
    })

    const { registerSession } = encapsulation

    this.state.session.establishing = true
    this.state.TCP.establishing = true

    const connectErr = new Error(
      'TIMEOUT occurred while attempting to establish TCP connection with Controller.',
    )

    // Connect to Controller and Then Send Register Session Packet
    await promiseTimeout(
      new Promise<void>((resolve) => {
        this.socket.connect(EIP_PORT, IP_ADDR, () => {
          this.state.TCP.establishing = false
          this.state.TCP.established = true

          this.write(registerSession())
          resolve()
        })
      }),
      10000,
      connectErr,
    )

    const sessionErr = new Error(
      'TIMEOUT occurred while attempting to establish Ethernet/IP session with Controller.',
    )

    // Wait for Session to be Registered
    const sessid = await promiseTimeout(
      new Promise<number | null>((resolve) => {
        this.socket.on('Session Registered', (sessid) => {
          resolve(sessid)
        })

        this.socket.on('Session Registration Failed', (error) => {
          this.state.error.code = error
          this.state.error.msg = 'Failed to Register Session'
          resolve(null)
        })
      }),
      10000,
      sessionErr,
    )

    // Clean Up Local Listeners
    this.socket.removeAllListeners('Session Registered')
    this.socket.removeAllListeners('Session Registration Failed')

    // Return Session ID
    return sessid
  }

  write(
    data: Buffer,
    connected: boolean = false,
    timeout: number = 10,
    cb: WriteCipCallback | null = null,
  ): void {
    const { sendRRData, sendUnitData } = encapsulation
    const { session, connection } = this.state

    if (session.established && session.id !== null && connection.id !== null) {
      const packet = connected
        ? sendUnitData(session.id, data, connection.id, connection.seq_num)
        : sendRRData(session.id, data, timeout)

      if (cb != null) {
        this.socket.write(packet, cb)
      } else {
        this.socket.write(packet)
      }
    }
  }

  destroy(exception: any): void {
    if (this.state.session.id !== null) {
      const { unregisterSession } = encapsulation
      this.socket.write(unregisterSession(this.state.session.id), () => {
        this.state.session.established = false
        this.socket.destroy(exception)
      })
    }
  }

  private _initializeEventHandlers(): void {
    this.socket.on('data', this._handleDataEvent)
    this.socket.on('close', this._handleCloseEvent)
  }

  private _handleDataEvent(data: Buffer): void {
    const { header, CPF, commands } = encapsulation

    const encapsulatedData = header.parse(data)
    const { statusCode, status, commandCode } = encapsulatedData

    if (statusCode !== 0) {
      console.log(`Error <${statusCode}>:`, status)

      this.state.error.code = statusCode
      this.state.error.msg = status

      this.socket.emit('Session Registration Failed', this.state.error)
    } else {
      this.state.error.code = null
      this.state.error.msg = null
      /* eslint-disable indent */
      switch (commandCode) {
        case commands.RegisterSession:
          this.state.session.establishing = false
          this.state.session.established = true
          this.state.session.id = encapsulatedData.session
          this.socket.emit('Session Registered', this.state.session.id)
          break

        case commands.UnregisterSession:
          this.state.session.established = false
          this.socket.emit('Session Unregistered')
          break

        case commands.SendRRData: {
          const buf1 = Buffer.alloc(encapsulatedData.length - 6) // length of Data - Interface Handle <UDINT> and Timeout <UINT>
          encapsulatedData.data?.copy(buf1, 0, 6)

          const srrd = CPF.parse(buf1)
          this.socket.emit('SendRRData Received', srrd)
          break
        }
        case commands.SendUnitData: {
          const buf2 = Buffer.alloc(encapsulatedData.length - 6) // length of Data - Interface Handle <UDINT> and Timeout <UINT>
          encapsulatedData.data?.copy(buf2, 0, 6)

          const sud = CPF.parse(buf2)
          this.socket.emit('SendUnitData Received', sud)
          break
        }
        default:
          this.socket.emit(
            'Unhandled Encapsulated Command Received',
            encapsulatedData,
          )
      }
      /* eslint-enable indent */
    }
  }

  private _handleCloseEvent(hadError: boolean): void {
    this.state.session.established = false
    this.state.TCP.established = false
    if (hadError) throw new Error('Socket Transmission Failure Occurred!')
  }
}

export { ENIP, CIP, encapsulation }
