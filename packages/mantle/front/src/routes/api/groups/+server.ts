import { json } from '@sveltejs/kit'

export async function GET({ locals }) {
  const { groups } = locals
  return json(groups)
}
