import { json } from '@sveltejs/kit'
export async function GET({ locals}) {
  const { tentacleStatus } = locals
  return json(tentacleStatus)
}