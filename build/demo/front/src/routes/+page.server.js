import { getNodes } from '$lib/mantle.js';
/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    return {
        nodes: await getNodes().then((nodes) => {
            return nodes.filter(node => node.group === 'kraken-demo');
        })
    };
}
