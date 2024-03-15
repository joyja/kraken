<script context="module">
	// retain module scoped expansion state for each tree node
	const _expansionState = {
		/* treeNodeId: expanded <boolean> */
	}
</script>
<script>
//	import { slide } from 'svelte/transition'
	export let tree
	export let unborn = false
	let children

	$: label = tree.id || tree.name
	$: if (!unborn) {
		children = tree.nodes || tree.devices || tree.value?.metrics || tree.metrics || []
	} else {
		children = tree.unbornNodes || tree.unbornDevices || tree.value?.metrics || tree.metrics || []
	}
	$: value = tree.value

	let expanded = _expansionState[label] || false
	const toggleExpansion = () => {
		expanded = _expansionState[label] = !expanded
	}
	$: arrowDown = expanded
</script>

<ul>
	<li>
		{#if children}
			<button class="node" on:click={toggleExpansion}>
				{#if children && children.length > 0 }<span class="arrow" class:arrowDown>&#x25b6</span>{/if}
				<span class="node__label">{label}</span>
				{#if value && typeof value !== 'object'}<span>{value}</span>{:else}<span></span>{/if}
      </button>
			{#if expanded}
				{#each children as child}
					<svelte:self tree={child} />
				{/each}
			{/if}
		{:else}
			<span>
				<span class="no-arrow"/>
				{label}
			</span>
		{/if}
	</li>
</ul>

<style lang="scss">
	.node {
		display:flex;
		width: 100%;
		align-items: center;
		&__label {
			text-align: left;
			flex-basis: 200px;
			flex-shrink: 0;
			flex-grow: 1;
		}
	}
	button {
		background-color: transparent;
		border: none;
		padding: var(--spacing-unit);
	}
	ul {
		margin: 0;
		list-style: none;
		padding-left: 1.2rem; 
		user-select: none;
	}
	.no-arrow { padding-left: 1.0rem; }
	.arrow {
		cursor: pointer;
		display: inline-block;
		/* transition: transform 200ms; */
		transition: transform .3s ease-out;
		margin-right: var(--spacing-unit);
	}
	.arrowDown { transform: rotate(90deg); transform-origin: center;}
</style>