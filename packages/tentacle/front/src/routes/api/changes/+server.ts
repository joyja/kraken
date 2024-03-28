import { json } from '@sveltejs/kit'

export async function GET({ locals}) {
  const { changes } = locals
  return json(changes)
}