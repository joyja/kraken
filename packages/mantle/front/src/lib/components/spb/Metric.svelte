<script lang="ts">
	import Long from 'long'

	export let metric
	function parseMetricValue(
		value: { high: number; low: number; unsigned: boolean } | number | string
	) {
		if (
			value != null &&
			typeof value === 'object' &&
			Object.hasOwn(value, 'high') &&
			Object.hasOwn(value, 'low') &&
			Object.hasOwn(value, 'unsigned')
		) {
			return new Long(value.low, value.high, value.unsigned).toNumber()
		} else if (typeof value !== 'object') {
			const numericValue = typeof value === 'string' ? parseFloat(value) : value
			return !isNaN(numericValue)
				? numericValue.toFixed(numericValue % 1 !== 0 ? 2 : 0)
				: value
		} else {
			console.error('Unknown value type')
		}
	}
</script>

<div class="metric">
	<div class="metric__update-count">{metric.updatesLastMinute}</div>
	<span class="metric__header">{metric.id}</span>
	{#if metric.value && Object.hasOwn(metric.value, 'isDefinition')}
		<button>Template</button>
		<!-- <pre>{JSON.stringify(metric.value, null, 4)}</pre> -->
	{:else}
		<span class="metric__value">{parseMetricValue(metric.value)}</span>
	{/if}
</div>

<style lang="scss">
	.metric {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		@container (max-width: 600px) {
			flex-wrap: wrap;
		}
		&__update-count {
			display: flex;
			justify-content: center;
			align-items: center;
			color: var(--theme-neutral-600);
			// background-color: var(--theme-neutral-400);
			border: solid 1px var(--theme-neutral-400);
			border-radius: var(--rounded-full);
			padding: 2px;
			font-size: var(--text-xs);
			line-height: var(--text-xs-lh);
			flex-basis: 2rem;
			flex-shrink: 0;
			@container (max-width: 600px) {
				order: 1;
			}
		}
		&__header {
			flex-basis: 500px;
			font-size: var(--text-sm);
			line-height: var(--text-sm-lh);
			color: var(--theme-neutral-500);
			font-weight: var(--font-bold);
			transition: all 0.3s ease-out;
			@container (max-width: 600px) {
				font-weight: var(--font-normal);
				flex: 1 1 100%;
				margin-bottom: var(--spacing-unit);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			// flex-shrink: 0;
			// flex-grow: 0;
		}
		&__value {
			font-size: var(--text-sm);
			line-height: var(--text-sm-lh);
			text-align: right;
			overflow: hidden;
			text-overflow: ellipsis;
			flex-basis: 500px;
			flex-shrink: 1;
			flex-grow: 1;
			@container (max-width: 600px) {
				flex: 1 1 50%;
				order: 2;
			}
		}
		& > * {
			margin-left: var(--spacing-unit);
		}
		& > *:first-child {
			margin-left: 0px;
		}
	}
	// @media (max-width: 480px) {
	// 	.metric {
	// 		display: grid;
	// 		grid-template-columns: 40px 1fr;
	// 		grid-template-rows: 1fr 1fr;
	// 		&__update-count {
	// 			grid-column-start: 1;
	// 			grid-column-end: span 1;
	// 			grid-row-start: 1;
	// 			grid-row-end: span 1;
	// 		}
	// 		&__header {
	// 			grid-column-start: 2;
	// 			grid-column-end: span 1;
	// 			grid-row-start: 2;
	// 			grid-row-end: span 1;
	// 			text-align: right;
	// 			color: var(--theme-neutral-400);
	// 		}
	// 		&__value {
	// 			grid-column-start: 1;
	// 			grid-column-end: span 2;
	// 			grid-row-start: 1;
	// 			grid-row-end: span 1;
	// 		}
	// 	}
	// }
</style>
