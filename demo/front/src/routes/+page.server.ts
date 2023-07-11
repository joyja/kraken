import { getNodes } from '$lib/mantle.js';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
  return {
    nodes: await getNodes()
  }
}