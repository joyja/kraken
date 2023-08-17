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

export class Log {
  public level:LogLevel
  public context?:string
  constructor(context?:string) {
    this.level = process.env.SQUID_LOGLEVEL ? process.env.SQUID_LOGLEVEL as LogLevel : process.env.NODE_ENV === 'development' ? LogLevel.warn : LogLevel.warn
    this.context = context
  }
  debug(message:string) {
    if (this.level === LogLevel.debug) {
      console.debug(`${this.context ? `${this.context}: `:``}${message}`)
    }
  }
  info(message:string) {
    if ([LogLevel.info, LogLevel.debug].includes(this.level)) {
      console.info(`${this.context ? `${this.context}: `:``}${message}`)
    } 
  }
  warn(message:string) {
    if ([LogLevel.warn, LogLevel.info, LogLevel.debug].includes(this.level)) {
      console.warn(`${this.context ? `${this.context}: `:``}${message}`)
    }
  }
  error(message:string) {
    if ([LogLevel.error, LogLevel.warn, LogLevel.info, LogLevel.debug].includes(this.level)) {
      console.error(`${this.context ? `${this.context}: `:``}${message}`)
    }
  }
  getErrorMessage(error: unknown) {
    return toErrorWithMessage(error).message
  }
}