import { json } from '@sveltejs/kit'
export async function GET({ locals }) {
	const { variables } = locals
	return json(variables)
}
