<script lang="ts">
	export let id: string
	export let name: string
	export let group: string
	export let options = [
		{
			label: 'Option 1',
			value: 'option1'
		},
		{
			label: 'Option 2',
			value: 'option2'
		}
	]
</script>

<fieldset {id} class="flex radio-horizontal">
	{#each options as option}
		<div class="radio_horizontal__option">
			<input type="radio" id={`${id}-${option.value}`} {name} value={option.value} bind:group />
			<label class="radio-horizontal__label" for={`${id}-${option.value}`}>{option.label}</label>
		</div>
	{/each}
</fieldset>

<style lang="scss">
	input[type='radio'] {
		display: none;
	}
	.radio-horizontal {
		& > div:first-child {
			& > .radio-horizontal__label {
				border-top-left-radius: var(--rounded-md);
				border-bottom-left-radius: var(--rounded-md);
				border-left: solid 1px var(--theme-neutral-300);
			}
		}
		& > div {
			& > .radio-horizontal__label {
				background-color: var(--theme-neutral-100);
				padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 3);
				border: 2px solid transparent;
				border-top: solid 1px var(--theme-neutral-300);
				border-bottom: solid 1px var(--theme-neutral-300);
				border-right: solid 1px var(--theme-neutral-300);
				border-left: none;
				cursor: pointer;
				transition: background-color 0.3s ease;
			}
		}
		& > div:last-child {
			& > .radio-horizontal__label {
				border-top-right-radius: var(--rounded-md);
				border-bottom-right-radius: var(--rounded-md);
			}
		}
	}
	/* Style for the label when the radio button is checked */
	input[type='radio']:checked + label {
		background-color: var(--theme-primary);
		border-color: var(--theme-primary);
		color: var(--white);
	}
</style>
