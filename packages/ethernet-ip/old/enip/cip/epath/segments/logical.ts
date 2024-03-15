const LOGICAL_SEGMENT: number = 1 << 5

export const types: Record<string, number> = {
  ClassID: 0 << 2,
  InstanceID: 1 << 2,
  MemberID: 2 << 2,
  ConnPoint: 3 << 2,
  AttributeID: 4 << 2,
  Special: 5 << 2,
  ServiceID: 6 << 2,
}

/**
 * Determines the Validity of the Type Code
 *
 * @param type - Logical Segment Type Code
 * @returns boolean indicating the validity
 */
const validateLogicalType = (type: number): boolean => {
  for (const key of Object.keys(types)) {
    if (types[key] === type) return true
  }
  return false
}

/**
 * Builds Single Logical Segment Buffer
 *
 * @param type - Valid Logical Segment Type
 * @param address - Logical Segment Address
 * @param padded - Padded or Packed EPATH format. Default is true.
 * @returns Buffer containing the logical segment
 */
export const build = (
  type: number,
  address: number,
  padded: boolean = true,
): Buffer => {
  if (!validateLogicalType(type))
    throw new Error('Invalid Logical Type Code Passed to Segment Builder')

  if (typeof address !== 'number' || address <= 0)
    throw new Error('Passed Address Must be a Positive Integer')

  let buf: Buffer = Buffer.alloc(0) // Initialize Output Buffer

  // Determine Size of Logical Segment Value and Build Buffer
  let format: number | null = null
  if (address <= 255) {
    format = 0

    buf = Buffer.alloc(2)
    buf.writeUInt8(address, 1)
  } else if (address > 255 && address <= 65535) {
    format = 1

    if (padded) {
      buf = Buffer.alloc(4)
      buf.writeUInt16LE(address, 2)
    } else {
      buf = Buffer.alloc(3)
      buf.writeUInt16LE(address, 1)
    }
  } else {
    format = 2

    if (padded) {
      buf = Buffer.alloc(6)
      buf.writeUInt32LE(address, 2)
    } else {
      buf = Buffer.alloc(5)
      buf.writeUInt32LE(address, 1)
    }
  }

  // Build Segment Byte
  const segmentByte: number = LOGICAL_SEGMENT | type | format
  buf.writeUInt8(segmentByte, 0)

  return buf
}
