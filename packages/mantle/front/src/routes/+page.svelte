<script lang="ts">
	import { invalidate } from '$app/navigation'
	import { onDestroy, onMount } from 'svelte'
	import { groups } from '$lib/stores/groups.js'
	import Group from '$lib/components/spb/Group.svelte'
	import Legend from '$lib/components/spb/Legend.svelte'
	import type { RestructuredNode } from '$lib/types.js'
	export let data

	type Group = {
		id: string
		nodes: Node[]
	}

	type Node = {
		id: string
		devices: Device[]
	}

	type Device = {
		id: string
		metrics: Metric[]
	}

	type Metric = {
		id: string
		value: string
		type: string
	}

	function restructureData(
		input: Group | Node | Device | Metric | (Group | Node | Device | Metric)[]
	): RestructuredNode | RestructuredNode[] {
		if (Array.isArray(input)) {
			return input.map(restructureData) as RestructuredNode[]
		}

		let result: RestructuredNode = {
			id: input.id,
			name: input.id
		}

		if ('nodes' in input) {
			result.nodeType = 'group'
			result.children = restructureData(input.nodes) as RestructuredNode[]
		} else if ('devices' in input) {
			result.nodeType = 'node'
			result.children = restructureData(input.devices) as RestructuredNode[]
		} else if ('metrics' in input) {
			result.nodeType = 'device'
			result.children = restructureData(input.metrics) as RestructuredNode[]
		} else if (!['Node Control', 'Device Control'].includes(input.type)) {
			result.nodeType = 'metric'
			result.children = []
			result.value = 1
		}

		return result
	}

	$: heirarchy = restructureData(data.groups)
	$: groups.set(
		data.groups.map((group: Group) => {
			// Ensure hierarchy is treated as an array
			const heirarchyArray = Array.isArray(heirarchy) ? heirarchy : [heirarchy]
			return {
				...group,
				heirarchy: heirarchyArray.find((node) => node.name === group.id)
			}
		})
	)
	let interval: ReturnType<typeof setInterval>
	onMount(() => {
		interval = setInterval(() => {
			invalidate('/api/groups')
		}, 2500)
	})
	onDestroy(() => {
		clearInterval(interval)
	})
</script>

<div class="flex justify-center">
	<div
		class="flex flex-column flex-shrink-1 flex-grow-0 space-y-1"
		style="flex-basis: 900px;"
	>
		<div class="flex"><Legend /></div>
		{#each $groups as group}
			<div><Group {group} /></div>
		{/each}
	</div>
</div>
