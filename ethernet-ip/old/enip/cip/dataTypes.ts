interface TypeCodes {
  [key: string]: number
  BOOL: number
  SINT: number
  INT: number
  DINT: number
  LINT: number
  USINT: number
  UINT: number
  UDINT: number
  REAL: number
  LREAL: number
  STIME: number
  DATE: number
  TIME_AND_DAY: number
  DATE_AND_STRING: number
  STRING: number
  WORD: number
  DWORD: number
  BIT_STRING: number
  LWORD: number
  STRING2: number
  FTIME: number
  LTIME: number
  ITIME: number
  STRINGN: number
  SHORT_STRING: number
  TIME: number
  EPATH: number
  ENGUNIT: number
  STRINGI: number
  STRUCT: number
}

export const Types: TypeCodes = {
  BOOL: 0xc1,
  SINT: 0xc2,
  INT: 0xc3,
  DINT: 0xc4,
  LINT: 0xc5,
  USINT: 0xc6,
  UINT: 0xc7,
  UDINT: 0xc8,
  REAL: 0xca,
  LREAL: 0xcb,
  STIME: 0xcc,
  DATE: 0xcd,
  TIME_AND_DAY: 0xce,
  DATE_AND_STRING: 0xcf,
  STRING: 0xd0,
  WORD: 0xd1,
  DWORD: 0xd2,
  BIT_STRING: 0xd3,
  LWORD: 0xd4,
  STRING2: 0xd5,
  FTIME: 0xd6,
  LTIME: 0xd7,
  ITIME: 0xd8,
  STRINGN: 0xd9,
  SHORT_STRING: 0xda,
  TIME: 0xdb,
  EPATH: 0xdc,
  ENGUNIT: 0xdd,
  STRINGI: 0xde,
  STRUCT: 0xa002,
}

/**
 * Checks if an Inputted Integer is a Valid Type Code (Vol1 Appendix C)
 *
 * @param num - Integer to be Tested
 * @returns {boolean}
 */
export const isValidTypeCode = (num: number): boolean => {
  if (!Number.isInteger(num)) return false
  for (const type of Object.keys(Types)) {
    if (Types[type] === num) return true
  }
  return false
}

/**
 * Retrieves Human Readable Version of an Inputted Type Code
 *
 * @param num - Type Code to Request Human Readable version
 * @returns {string | null} Type Code String Interpretation
 */
export const getTypeCodeString = (num: number): string | null => {
  if (!Number.isInteger(num)) return null
  for (const type of Object.keys(Types)) {
    if (Types[type] === num) return type
  }
  return null
}
