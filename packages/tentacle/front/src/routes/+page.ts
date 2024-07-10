import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch }) => {
	const variables = await fetch('/api/values').then((res) => res.json())
	const metrics = await fetch('/api/metrics').then((res) => res.json())
	const changes = await fetch('/api/changes').then((res) => res.json())
	const tentacleStatus = await fetch('/api/status').then((res) => res.json())
	return {
		variables,
		metrics,
		changes,
		tentacleStatus
	}
}
