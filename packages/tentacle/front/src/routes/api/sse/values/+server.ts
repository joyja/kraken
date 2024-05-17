import { variableEvents } from '$lib/sse.js'

export function GET({ locals }) {
	/** @type {ReturnType<typeof setInterval> | undefined} */
	let onChange:() => void
	const stream = new ReadableStream({
		start(controller) {
			onChange = () => {
				controller.enqueue('event:message\ndata: ' + JSON.stringify({ variables: locals.variables }) + '\n\n');
			}
			variableEvents.on('change', onChange)		
		},
		cancel() {
			variableEvents.off('change', onChange)
		}
	});
	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
}
