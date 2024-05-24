<script lang="ts">
	import TidyTree from '../diagrams/TidyTree.svelte'
	import Horizontal from '../form/select/radio/Horizontal.svelte'
	import Sunburst from '../diagrams/SunBurst.svelte'
	import Node from './Node.svelte'
	import { slide } from 'svelte/transition'
	import type { SparkplugGroup } from '$lib/types'
	export let group: SparkplugGroup
	let expanded = false
	let selectedDiagram = 'tidytree'
</script>

<div class="group" class:group--expanded={expanded}>
	<div class="flex flex-column" style="margin-top:calc(var(--spacing-unit)*3)">
		<div class="mb-5">
			<Horizontal
				id={`group-${group.id}`}
				name={`group-${group.id}`}
				bind:group={selectedDiagram}
				options={[
					{ label: 'Tidy Tree', value: 'tidytree' },
					{ label: 'Sun Burst', value: 'sunburst' }
				]}
			/>
		</div>
		{#if selectedDiagram === 'tidytree'}
			<div transition:slide>
				<TidyTree id={group.id} input={group.heirarchy} />
			</div>
		{:else}
			<div class="flex justify-center" style="width:100%" transition:slide>
				<div
					class="flex-grow-0 flex-shrink-1"
					style="flex-basis: 800px; aspect-ratio: 1;"
				>
					<Sunburst
						id={group.id}
						data={{ name: 'root', children: group.heirarchy.children }}
					/>
				</div>
			</div>
		{/if}
	</div>
	<div class="header">
		<h2>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
				><title>apps</title><path
					fill="var(--theme-neutral-950)"
					d="M16,20H20V16H16M16,14H20V10H16M10,8H14V4H10M16,8H20V4H16M10,14H14V10H10M4,14H8V10H4M4,20H8V16H4M10,20H14V16H10M4,8H8V4H4V8Z"
				/></svg
			>
			{group.id}
		</h2>
		<button
			on:click={() => {
				expanded = !expanded
			}}
		>
			<svg
				class:expanded
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
			>
				<path
					stroke="var(--theme-neutral-950)"
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M19.5 8.25l-7.5 7.5-7.5-7.5"
				/>
			</svg>
		</button>
	</div>
	{#if expanded}
		<div transition:slide class="children">
			{#each group.nodes as node}
				<div>
					<Node {node} {group} />
				</div>
			{/each}
			{#each group.unbornNodes as node}
				<div>
					<Node {node} {group} unborn={true} />
				</div>
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		& > button {
			background-color: transparent;
			border: none;
			cursor: pointer;
			& > svg {
				height: 24px;
				width: 24px;
				transition: transform 0.3s ease-out;
			}
			& > .expanded {
				transform: rotate(180deg);
			}
		}
		& > h2 {
			display: flex;
			align-items: center;
			& > svg {
				height: 20px;
				width: 20px;
				margin-right: var(--spacing-unit);
			}
			font-size: var(--text-sm);
			line-height: var(--text-sm-lh);
		}
	}
	.group {
		background-color: var(--theme-neutral-100);
		border: 1px solid var(--theme-neutral-300);
		box-shadow: var(--shadow-md);
		border-radius: var(--rounded-md);
		padding-top: calc(var(--spacing-unit));
		padding-left: calc(var(--spacing-unit));
		padding-right: calc(var(--spacing-unit));
		padding-bottom: 0px;
		&--expanded {
			padding-bottom: calc(var(--spacing-unit));
		}
		& > .children {
			& > div {
				margin-top: calc(var(--spacing-unit) * 3);
			}
			& > div:first-child {
				margin-top: 0px;
			}
		}
	}
</style>
