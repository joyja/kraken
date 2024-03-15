type CommandMap = Record<string, number>

const commands: CommandMap = {
  NOP: 0x00,
  ListServices: 0x04,
  ListIdentity: 0x63,
  ListInterfaces: 0x64,
  RegisterSession: 0x65,
  UnregisterSession: 0x66,
  SendRRData: 0x6f,
  SendUnitData: 0x70,
  IndicateStatus: 0x72,
  Cancel: 0x73,
}

const parseStatus = (status: number): string => {
  if (typeof status !== 'number')
    throw new Error('parseStatus accepts interface <Number> only!')

  switch (status) {
    case 0x00:
      return 'SUCCESS'
    case 0x01:
      return 'FAIL: Sender issued an invalid ecapsulation command.'
    case 0x02:
      return 'FAIL: Insufficient memory resources to handle command.'
    case 0x03:
      return 'FAIL: Poorly formed or incorrect data in encapsulation packet.'
    case 0x64:
      return 'FAIL: Originator used an invalid session handle.'
    case 0x65:
      return 'FAIL: Target received a message of invalid length.'
    case 0x69:
      return 'FAIL: Unsupported encapsulation protocol revision.'
    default:
      return `FAIL: General failure <${status}> occured.`
  }
}

const validateCommand = (cmd: number): boolean => {
  for (const key of Object.keys(commands)) {
    if (cmd === commands[key]) return true
  }
  return false
}

interface CommonPacketData {
  TypeID: number
  data: Buffer
}

interface ItemIDs {
  [key: string]: number
  Null: number
  ListIdentity: number
  ConnectionBased: number
  ConnectedTransportPacket: number
  UCMM: number
  ListServices: number
  SockaddrO2T: number
  SockaddrT2O: number
  SequencedAddrItem: number
}

const CPF = {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  ItemIDs: {
    Null: 0x00,
    ListIdentity: 0x0c,
    ConnectionBased: 0xa1,
    ConnectedTransportPacket: 0xb1,
    UCMM: 0xb2,
    ListServices: 0x100,
    SockaddrO2T: 0x8000,
    SockaddrT2O: 0x8001,
    SequencedAddrItem: 0x8002,
  } as ItemIDs,
  isCmd(cmd: number): boolean {
    for (const key of Object.keys(this.ItemIDs)) {
      if (cmd === this.ItemIDs[key]) return true
    }
    return false
  },
  build(dataItems: CommonPacketData[]): Buffer {
    let buf = Buffer.alloc(2)
    buf.writeUInt16LE(dataItems.length, 0)

    for (const item of dataItems) {
      const { TypeID, data } = item

      if (!this.isCmd(TypeID)) throw new Error('Invalid CPF Type ID!')

      const buf1 = Buffer.alloc(4)
      const buf2 = Buffer.from(data)

      buf1.writeUInt16LE(TypeID, 0)
      buf1.writeUInt16LE(buf2.length, 2)

      buf =
        buf2.length > 0
          ? Buffer.concat([buf, buf1, buf2])
          : Buffer.concat([buf, buf1])
    }

    return buf
  },
  parse(buf: Buffer): CommonPacketData[] {
    const itemCount = buf.readUInt16LE(0)

    let ptr = 2
    const arr: CommonPacketData[] = []

    for (let i = 0; i < itemCount; i++) {
      const TypeID = buf.readUInt16LE(ptr)
      ptr += 2

      const length = buf.readUInt16LE(ptr)
      ptr += 2

      const data = Buffer.alloc(length)
      buf.copy(data, 0, ptr, ptr + length)

      arr.push({ TypeID, data })
      ptr += length
    }

    return arr
  },
}

interface EncapsulationData {
  commandCode: number
  command: string | null
  length: number
  session: number
  statusCode: number
  status: string | null
  options: number
  data: Buffer | null
}

const header = {
  build(
    cmd: number,
    session: number = 0x00,
    data: Buffer | number[] = [],
  ): Buffer {
    if (!validateCommand(cmd)) throw new Error('Invalid Encapsulation Command!')

    const buf = Buffer.from(data)
    const send = {
      cmd,
      length: buf.length,
      session,
      status: 0x00,
      context: Buffer.alloc(8, 0x00),
      options: 0x00,
      data: buf,
    }

    const header = Buffer.alloc(24 + send.length)
    header.writeUInt16LE(send.cmd, 0)
    header.writeUInt16LE(send.length, 2)
    header.writeUInt32LE(send.session, 4)
    header.writeUInt32LE(send.status, 8)
    send.context.copy(header, 12)
    header.writeUInt32LE(send.options, 20)
    send.data.copy(header, 24)

    return header
  },
  parse(buf: Buffer): EncapsulationData {
    if (!Buffer.isBuffer(buf))
      throw new Error('header.parse accepts interface <Buffer> only!')

    const received = {
      commandCode: buf.readUInt16LE(0),
      command: null as string | null,
      length: buf.readUInt16LE(2),
      session: buf.readUInt32LE(4),
      statusCode: buf.readUInt32LE(8),
      status: null as string | null,
      options: buf.readUInt32LE(20),
      data: null as Buffer | null,
    }

    const dataBuffer = Buffer.alloc(received.length)
    buf.copy(dataBuffer, 0, 24)

    received.data = dataBuffer
    received.status = parseStatus(received.statusCode)

    for (const key of Object.keys(commands)) {
      if (received.commandCode === commands[key]) {
        received.command = key
        break
      }
    }

    return received
  },
}

const registerSession = (): Buffer => {
  const cmdBuf = Buffer.alloc(4)
  cmdBuf.writeUInt16LE(0x01, 0)
  cmdBuf.writeUInt16LE(0x00, 2)

  return header.build(commands.RegisterSession, 0x00, cmdBuf)
}

const unregisterSession = (session: number): Buffer => {
  return header.build(commands.UnregisterSession, session)
}

const sendRRData = (
  session: number,
  data: Buffer,
  timeout: number = 10,
): Buffer => {
  const cmdBuf = Buffer.alloc(4 + data.length)
  cmdBuf.writeUInt16LE(data.length, 0)
  cmdBuf.writeUInt16LE(timeout, 2)
  data.copy(cmdBuf, 4)

  return header.build(commands.SendRRData, session, cmdBuf)
}

const sendUnitData = (
  session: number,
  data: Buffer,
  ConnectionID: number,
  SequnceNumber: number,
): Buffer => {
  const { SendUnitData } = commands

  const timeoutBuf = Buffer.alloc(6)
  timeoutBuf.writeUInt32LE(0x00, 0) // Interface Handle ID (Shall be 0 for CIP)
  timeoutBuf.writeUInt16LE(0x00, 4) // Timeout (sec) (Shall be 0 for Connected Messages)

  // Enclose in Common Packet Format
  const seqAddrBuf = Buffer.alloc(8)
  seqAddrBuf.writeUInt32LE(ConnectionID, 0)
  seqAddrBuf.writeUInt32LE(SequnceNumber, 4)

  let buf = CPF.build([
    {
      TypeID: CPF.ItemIDs.SequencedAddrItem,
      data: seqAddrBuf,
    },
    {
      TypeID: CPF.ItemIDs.ConnectedTransportPacket,
      data,
    },
  ])

  // Join Timeout Data with
  buf = Buffer.concat([timeoutBuf, buf])

  // Build SendRRData Buffer
  return header.build(SendUnitData, session, buf)
}

export {
  type CommandMap,
  commands,
  parseStatus,
  validateCommand,
  type CommonPacketData,
  CPF,
  type EncapsulationData,
  header,
  registerSession,
  unregisterSession,
  sendRRData,
  sendUnitData,
}
