import { json } from '@sveltejs/kit'

export async function GET({ locals}) {
  const { metrics } = locals
  return json(metrics)
}