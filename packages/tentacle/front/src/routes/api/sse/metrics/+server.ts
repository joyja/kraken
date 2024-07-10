import { metricEvents } from '$lib/sse.js'

export function GET({ locals }) {
	/** @type {ReturnType<typeof setInterval> | undefined} */
	let onChange: (metrics: any) => void
	const stream = new ReadableStream({
		start(controller) {
			onChange = (metrics) => {
				controller.enqueue('event:message\ndata: ' + JSON.stringify({ metrics }) + '\n\n')
			}
			metricEvents.on('change', onChange)
		},
		cancel() {
			metricEvents.off('change', onChange)
		}
	})
	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	})
}
