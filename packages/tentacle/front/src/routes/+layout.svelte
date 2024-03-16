<script lang="ts">
	import Sun from '$lib/components/icons/Sun.svelte';
	import Moon from '$lib/components/icons/Sun.svelte';
	import '$lib/css/main.scss';
	let theme = 'themeLight';
	import { onNavigate } from '$app/navigation';
	import PauseCircle from '$lib/components/icons/PauseCircle.svelte';
	import ArrowPath from '$lib/components/icons/ArrowPath.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import Toast from '$lib/components/Toast.svelte';
	import PlayCircle from '$lib/components/icons/PlayCircle.svelte';
	import '@fontsource/space-grotesk';

	export let data;
	function toggleTheme() {
		const highlightStyleLink = document.getElementById('highlightStyle') as HTMLLinkElement;
		document.body.classList.toggle(theme);
		if (theme == 'themeLight') {
			theme = 'themeDark';
			highlightStyleLink.href = '/css/a11y-dark.css';
		} else {
			theme = 'themeLight';
			highlightStyleLink.href = '/css/a11y-light.css';
		}
		document.body.classList.toggle(theme);
	}

	onNavigate((navigation) => {
		//@ts-ignore
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			//@ts-ignore
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
	let interval: ReturnType<typeof setInterval>;
	onMount(() => {
		// Initialize Prism.js
		interval = setInterval(() => {
			invalidateAll();
		}, 2500);
	});
	onDestroy(() => {
		clearInterval(interval);
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="/css/a11y-light.css" id="highlightStyle" />
</svelte:head>
<header>
	<nav>
		<a href="/"><img class="logo" src="/tentacle.png" alt="Tentacle" /></a>
		<div class="flex align-center space-x-1">
			<div
				class="plc-status"
				class:plc-status--running={data.running}
				class:plc-status--stopped={!data.running}
			>
				{data.running ? 'running' : 'stopped'}
			</div>
			<form
				method="POST"
				action={data.running ? `?/stopPLC` : `?/startPLC`}
				on:submit={() => {}}
				use:enhance
			>
				<button class="button--icon button__dark-mode"
					>{#if data.running}<PauseCircle />{:else}<PlayCircle />{/if}</button
				>
			</form>
			<form method="POST" action="?/restartPLC" on:submit={() => {}} use:enhance>
				<button class="button--icon button__dark-mode"><ArrowPath /></button>
			</form>
			<button type="button" class="button--icon button__dark-mode" on:click={toggleTheme}
				>{#if theme === 'themeDark'}<Moon />{:else}<Sun />{/if}</button
			>
		</div>
	</nav>
</header>
<slot />
<Toast />

<style class="scss">
	.plc-status {
		padding-top: calc(var(--spacing-unit) * 0.5);
		padding-bottom: calc(var(--spacing-unit) * 0.75);
		padding-left: calc(var(--spacing-unit) * 2);
		padding-right: calc(var(--spacing-unit) * 2);
		border-radius: var(--rounded-full);
		transition: background-color 0.3s ease-out;
	}
	.plc-status--running {
		color: var(--white);
		background-color: var(--green-500);
	}
	.plc-status--stopped {
		color: var(--white);
		background-color: var(--neutral-500);
	}
	header {
		& > nav {
			display: flex;
			justify-content: space-between;
		}
		padding: var(--spacing-unit);
	}
	.logo {
		width: 150px;
	}
</style>
