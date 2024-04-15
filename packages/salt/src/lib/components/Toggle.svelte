<script lang="ts">
	import { enhance } from '$app/forms';

	export let id: string;
	export let checked = false;
	export let name: string;
	export let selector: string | null = null;
	export let selectorName: string = '';
  export let buttonType: 'button' | 'submit' = 'button';
</script>

<button
	type={buttonType}
	class="toggle-switch"
	class:toggle-switch--active={checked}
	on:click={() => {if (buttonType === 'button') checked = !checked }}
>
	<span class="slider" />
</button>
<input {id} {name} type="hidden" value={!checked} />
{#if selector !== null}
	<input id={`selector${id}`} name={selectorName} type="hidden" value={selector} />
{/if}

<style lang="scss">
	/* Define the size variable */
	:root {
		--toggle-size: 40px;
	}

	/* Use the size variable for the toggle switch */
	.toggle-switch {
		display: inline-block;
		position: relative;
		width: var(--toggle-size);
		height: calc(var(--toggle-size) * 0.6); /* 60% of the width */
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #ccc;
		-webkit-transition: 0.4s;
		transition: 0.4s;
		border-radius: calc(var(--toggle-size) * 0.6); /* 60% of the width */
	}

	.slider:before {
		position: absolute;
		content: '';
		top: calc(var(--toggle-size) * 0.1);
		height: calc(var(--toggle-size) * 0.4);
		width: calc(var(--toggle-size) * 0.4); /* 52% of the width */
		left: calc(var(--toggle-size) * 0.08); /* 8% of the width */
		bottom: calc(var(--toggle-size) * 0.08); /* 8% of the width */
		background-color: white;
		-webkit-transition: 0.4s;
		transition: 0.4s;
		border-radius: 50%;
	}

	.toggle-switch--active > .slider {
		background-color: var(--theme-primary);
	}

	.toggle-switch:focus > .slider {
		box-shadow: 0 0 1px var(--theme-primary);
	}

	.toggle-switch--active > .slider:before {
		-webkit-transform: translateX(calc(var(--toggle-size) * 0.45)); /* 52% of the width */
		-ms-transform: translateX(calc(var(--toggle-size) * 0.45)); /* 52% of the width */
		transform: translateX(calc(var(--toggle-size) * 0.45)); /* 52% of the width */
	}
</style>
