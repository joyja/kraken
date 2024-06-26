import chalk from 'chalk'

export enum LogLevel {
	debug = 'DEBUG',
	info = 'INFO',
	warn = 'WARN',
	error = 'ERROR'
}

interface ErrorWithMessage {
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

function joinWithConjunction(arr: string[], conjunction: 'and' | 'or' = 'or'): string {
	if (arr.length === 0) return ''
	if (arr.length === 1) return arr[0]

	// Join all elements except the last with a comma and space
	const allButLast = arr.slice(0, -1).join(', ')

	// Add the specified conjunction ('or' or 'and') before the last element
	return `${allButLast} ${conjunction} ${arr[arr.length - 1]}`
}

export class Log {
  static defaultLogLevel: LogLevel = LogLevel.info
	public level: LogLevel
	public context?: string
	constructor(context?: string) {
		this.context = context
    this.level = Log.defaultLogLevel
	}

	debug(message: string):void {
		if (this.level === LogLevel.debug) {
			console.debug(`${chalk.bgCyan(`${this.context}\t`)} ${chalk.cyan(message)}`)
		}
	}

	info(message: string):void {
		if ([LogLevel.info, LogLevel.debug].includes(this.level)) {
			console.info(`${chalk.bgWhite(`${this.context}\t`)} ${chalk.white(message)}`)
		}
	}

	warn(message: string):void {
		if ([LogLevel.warn, LogLevel.info, LogLevel.debug].includes(this.level)) {
			console.info(`${chalk.bgYellow(`${this.context}\t`)} ${chalk.yellow(message)}`)
		}
	}

	error(message: string):void {
		if ([LogLevel.error, LogLevel.warn, LogLevel.info, LogLevel.debug].includes(this.level)) {
			console.info(`${chalk.bgRed(`${this.context}\t`)} ${chalk.red(message)}`)
		}
	}

	getErrorMessage(error: unknown):ErrorWithMessage['message'] {
		return toErrorWithMessage(error).message
	}
}
