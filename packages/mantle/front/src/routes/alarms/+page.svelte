<script lang="ts">
	import { Plus } from '@joyautomation/salt/icons'
	import { format } from 'date-fns'
	export let data
</script>

<div class="flex justify-center">
	<div class="flex flex-grow-0 flex-shrink-1" style="flex-basis: 1200px;">
		<ul>
			{#each data.alarmHistory as row}
				<li>
					<div>{row.alarm.name}</div>
					<div class="subtext">
						{format(row.timestamp, 'MM/dd/yyyy HH:mm:ss aa')}
					</div>
					<!-- <div>{row.alarm.priority}</div>
          <div>{row.acknowledged}</div>
          <div>{row.cleared}</div> -->
				</li>
			{/each}
			{#if data.alarmHistory.length === 0}
				<li class="flex flex-column justify-center align-center space-y-3 my-3">
					<span>There are no alarms here.</span>
					<button class="button--primary flex align-center"
						><Plus />Create One</button
					>
				</li>
			{/if}
		</ul>
	</div>
</div>

<style lang="scss">
	ul {
		border: solid 1px var(--theme-neutral-300);
		border-radius: var(--rounded-md);
		& > li {
			padding: var(--spacing-unit);
		}
		& > li:nth-child(even) {
			background-color: var(--theme-neutral-100);
		}
	}
	.subtext {
		font-size: var(--text-xs);
		line-height: var(--text-xs-lh);
		color: var(--theme-neutral-600);
	}
</style>
