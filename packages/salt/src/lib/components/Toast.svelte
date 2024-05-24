<script lang="ts">
	import { page } from '$app/stores';
	import { notifications, type Notification, addNotification } from '$lib/stores/notifications.js';
	import { slide } from 'svelte/transition';

	let notifications_value: Notification[];

	$: if ($page.form && $page.form?.message) {
		addNotification($page.form);
	}

	notifications.subscribe((value) => {
		notifications_value = value;
	});
</script>

<div class="toast">
	{#each notifications_value as notification}
		<div
			class:toast--success={notification.type === 'success'}
			class:toast--error={notification.type === 'error'}
			class:toast--warning={notification.type === 'warning'}
			transition:slide
		>
			{notification.message}
		</div>
	{/each}
</div>

<style lang="scss">
	.toast {
		position: fixed;
		top: var(--spacing-unit);
		right: 0;
		left: 0;
		margin: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: calc(var(--spacing-unit) * 3);
		z-index: 1000;
		display: flex;
		flex-direction: column-reverse;
		gap: var(--spacing-unit);
		pointer-events: none;
		border-radius: var(--rounded-md);
		& > div {
			padding: calc(var(--spacing-unit) * 2);
			border-radius: var(--rounded-md);
			font-size: var(--text-sm);
			pointer-events: auto;
		}
	}
	.toast--success {
		border: solid 1px var(--green-600);
		background-color: var(--green-200);
		color: var(--green-600);
	}
	.toast--error {
		border: solid 1px var(--red-600);
		background-color: var(--red-200);
		color: var(--red-600);
	}
	.toast--warning {
		border: solid 1px var(--amber-600);
		background-color: var(--amber-200);
		color: var(--amber-600);
	}
</style>
