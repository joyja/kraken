import { sendRequest } from '$lib/graphql/request'
import * as query from '$lib/graphql/query'
import * as mutation from '$lib/graphql/mutation'
import type { Actions } from '@sveltejs/kit'

export const actions: Actions = {
	async setTheme({ request, cookies }) {
		const data = await request.formData()
		const theme = data.get('theme') as string
		cookies.set(`theme`, theme, {
			path: '/',
			secure: false
		})
		return {
			context: 'setTheme',
			type: 'success',
			message: `Theme set to ${theme}`,
			theme
		}
	},
	async setValue({ request }) {
		const data = await request.formData()
		const variablePath = data.get('variablePath') as string
		const value = data.get('value') as string
		const context = 'setValue'
		let message = `${variablePath} set to ${value} !`
		let messageType = 'success'
		sendRequest({
			query: mutation.setValue,
			variables: {
				variablePath,
				value
			}
		})
			.then((res) => res.data?.setValue)
			.catch((error) => {
				messageType = 'error'
				message = error.message
			})
		return {
			context,
			message,
			type: messageType
		}
	},
	stopPLC() {
		const context = 'stopPLC'
		let message = 'PLC Stopped!'
		let messageType = 'success'
		sendRequest({
			query: mutation.stopPLC
		})
			.then((res) => res.data?.stopPLC)
			.catch((error) => {
				messageType = 'error'
				message = error.message
			})
		return {
			context,
			message,
			type: messageType
		}
	},
	startPLC() {
		const context = 'startPLC'
		let message = 'PLC Started!'
		let messageType = 'success'
		sendRequest({
			query: mutation.startPLC
		})
			.then((res) => res.data?.startPLC)
			.catch((error) => {
				messageType = 'error'
				message = error.message
			})
		return {
			context,
			message,
			type: messageType
		}
	},
	restartPLC() {
		const context = 'restart'
		let message = 'PLC Restarted!'
		let messageType = 'success'
		sendRequest({
			query: mutation.restartPLC
		})
			.then((res) => res.data?.restartPLC)
			.catch((error) => {
				messageType = 'error'
				message = error.message
			})
		return {
			context,
			message,
			type: messageType
		}
	},
	async getCode({ request }) {
		const data = await request.formData()
		const name = data.get('name') as string
		const visible = (data.get('set-visibility') as string) === 'true'
		const context = 'getCode'
		let messageType: string | undefined
		let message: string | undefined
		const program = await sendRequest({
			query: query.program,
			variables: {
				name
			}
		})
			.then((res) => res.data?.program)
			.catch((error) => {
				messageType = 'error'
				message = error.message
			})
		if (message) {
			return {
				context,
				message,
				type: messageType
			}
		} else {
			return {
				context,
				name,
				program,
				visible
			}
		}
	}
}
