import { variableEvents } from '$lib/variables.js'

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

// export function GET() {
// 	/** @type {ReturnType<typeof setInterval> | undefined} */
// 	let timer;

// 	const stream = new ReadableStream({
// 		start(controller) {
// 			timer = setInterval(() => {
// 				const current_time = new Date().toLocaleString();
// 				const data = `event: message\ndata: ${current_time}\n\n`;
// 				controller.enqueue(data);
// 			}, 1000);
// 		},
// 		cancel() {
// 			clearInterval(timer);
// 		}
// 	});

// 	return new Response(stream, {
// 		headers: {
// 			'Content-Type': 'text/event-stream'
// 		}
// 	});
// }