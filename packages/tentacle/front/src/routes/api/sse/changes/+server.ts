import { changeEvents } from '$lib/sse.js'

export function GET({ locals }) {
	/** @type {ReturnType<typeof setInterval> | undefined} */
	let onChange:(changes:any) => void
	const stream = new ReadableStream({
		start(controller) {
			onChange = (changes) => {
				controller.enqueue('event:message\ndata: ' + JSON.stringify({ changes }) + '\n\n');
			}
			changeEvents.on('change', onChange)		
		},
		cancel() {
			changeEvents.off('change', onChange)
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
