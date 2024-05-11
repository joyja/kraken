export const load = async ({ fetch }) => {
	const groups = await fetch('/api/groups').then((res) => res.json())
	return {
		groups
	}
}
