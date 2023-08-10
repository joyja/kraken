enum LogLevel {
  debug = "DEBUG",
  info = "INFO",
  warn = "WARN",
  error = "ERROR",
}

type ErrorWithMessage = {
  message: string
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  )
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError

  try {
    return new Error(JSON.stringify(maybeError))
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError))
  }
}

function getErrorMessage(error: unknown) {
  return toErrorWithMessage(error).message
}

export class Log {
  public level:LogLevel
  public context:string
  constructor(context:string) {
    this.level = process.env.MANTLE_LOGLEVEL ? process.env.MANTLE_LOGLEVEL as LogLevel : process.env.NODE_ENV === 'development' ? LogLevel.info : LogLevel.warn
    this.context = context
  }
  debug(message:string) {
    if (this.level === LogLevel.debug) {
      console.debug(`${this.context}: ${message}`)
    }
  }
  info(message:string) {
    if (this.level === LogLevel.info) {
      console.info(`${this.context}: ${message}`)
    } 
  }
  warn(message:string) {
    if (this.level === LogLevel.warn) {
      console.warn(`${this.context}: ${message}`)
    }
  }
  error(message:string) {
    if (this.level === LogLevel.error) {
      console.error(`${this.context}: ${message}`)
    }
  }
  getErrorMessage(error: unknown) {
    return toErrorWithMessage(error).message
  }
}