<script lang="ts">
	import type { PageData } from './$types';
	import Link from '$lib/components/icons/Link.svelte';
	import format from 'date-fns/format';
	import ChevronDown from '$lib/components/icons/ChevronDown.svelte';
	import { slide } from 'svelte/transition';
	import { enhance } from '$app/forms';
	// Using ES6 import syntax
	import hljs from 'highlight.js/lib/core';
	import javascript from 'highlight.js/lib/languages/javascript';
	import typescript from 'highlight.js/lib/languages/typescript';

	// Then register the languages you need
	hljs.registerLanguage('javascript', javascript);
	hljs.registerLanguage('typescript', typescript);

	export let data: PageData;
	export let form;
	let codes = [
		...data.programs.map((program) => {
			return { name: program, type: 'program', visible: false, code: '' };
		}),
		...data.classes.map((tClass) => {
			return { name: tClass.name, type: 'class', visible: false, code: '' };
		})
	];
	$: if (form?.context === 'getCode') {
		codes = codes.map((code) => {
			return code.name === form?.name
				? {
						...code,
						visible: form?.visible,
						code: hljs.highlight(form.program, { language: 'typescript' }).value
				  }
				: { ...code, visible: false };
		});
	}
</script>

<!-- <pre>{JSON.stringify(data, null, 2)}</pre> -->
<main>
	<div class="card changes">
		<p class="card__header">Changes</p>
		<ul class="card__content">
			{#if data?.changes && data.changes.length > 0}
				{#each data?.changes || [] as change}
					<li class="flex justify-between">
						<div>{format(change.timestamp, 'yyyy-MM-dd HH:mm:ss')}</div>
						<div>{change.event} {change.path}</div>
					</li>
				{/each}
			{:else}
				There are no changes.
			{/if}
		</ul>
	</div>
	<div class="card tasks">
		<p class="card__header">Tasks</p>
		<ul class="card__content">
			{#if data?.config?.tasks}
				{#each data?.config?.tasks || [] as task}
					<li>{task.name}</li>
				{/each}
			{:else}
				There are no tasks configured.
			{/if}
		</ul>
	</div>
	<div class="card mqtt">
		<p class="card__header">MQTT</p>
		<ul class="card__content">
			{#if data?.mqtt && data.mqtt.length > 0}
				{#each data?.mqtt || [] as mqtt}
					<li>{mqtt}</li>
				{/each}
			{:else}
				There are no MQTT connections configured.
			{/if}
		</ul>
	</div>
	<div class="card modbus">
		<p class="card__header">Modbus</p>
		<ul class="card__content">
			{#if data?.modbus && data.modbus.length > 0}
				{#each data?.modbus || [] as modbus}
					<li>{modbus}</li>
				{/each}
			{:else}
				There are no Modbus connections configured.
			{/if}
		</ul>
	</div>
	<div class="card opcua">
		<p class="card__header">OPCUA</p>
		<ul class="card__content">
			{#if data?.opcua && data.opcua.length > 0}
				{#each data?.opcua || [] as opcua}
					<li>{opcua}</li>
				{/each}
			{:else}
				There are no OPCUA connections configured.
			{/if}
		</ul>
	</div>
	<div class="card variables">
		<p class="card__header">Variables</p>
		<ul class="card__content">
			{#if data?.variables}
				{#each data?.variables || [] as variable}
					<li class="flex align-center">
						{variable.name}
						<div class="variable__attribute">P</div>
						{#if variable.source}<div class="variable__attribute"><Link /></div>{/if}
						<div class="flex-grow text-end">{variable.value}</div>
					</li>
				{/each}
			{:else}
				There are no variables configured.
			{/if}
		</ul>
	</div>
	{#if codes && codes.length > 0}
		<div class="codes">
			{#each codes || [] as code}
				<div class="card code">
					<div class="card__header flex align-center justify-between">
						<p>{code.name}</p>
						<form method="POST" action="?/getCode" use:enhance>
							<input type="hidden" name="name" value={code.name} />
							<input type="hidden" name="set-visibility" value={!code.visible} />
							<button class="button--icon expand" class:expand--open={code.visible}>
								<ChevronDown /></button
							>
						</form>
					</div>
					{#if code.visible}
						<div class="card__content" transition:slide>
							<pre>{@html code.code}</pre>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</main>

<style lang="scss">
	p {
		margin-bottom: 0;
	}
	main {
		container-name: main;
		container-type: inline-size;
		display: grid;
		grid-template-columns: repeat(12, 1fr);
		gap: var(--spacing-unit);
		margin-left: var(--spacing-unit);
		margin-right: var(--spacing-unit);
	}
	.changes {
		grid-row-start: 1;
		grid-column: span 4;
	}
	.tasks {
		grid-row-start: 2;
		grid-column: span 4;
	}
	.mqtt {
		grid-row-start: 3;
		grid-column: span 4;
	}
	.modbus {
		grid-row-start: 4;
		grid-column: span 4;
	}
	.opcua {
		grid-row-start: 5;
		grid-column: span 4;
	}
	.variables {
		grid-row: span 5;
		grid-column: span 8;
	}
	.codes {
		grid-column: span 12;
	}
	.card__content {
		overflow: auto;
	}
	@container (max-width:500px) {
		.changes {
			grid-row-start: 2;
			grid-column: span 12;
		}
		.tasks {
			grid-row-start: 3;
			grid-column: span 12;
		}
		.mqtt {
			grid-row-start: 4;
			grid-column: span 12;
		}
		.modbus {
			grid-row-start: 5;
			grid-column: span 12;
		}
		.opcua {
			grid-row-start: 6;
			grid-column: span 12;
		}
		.variables {
			grid-row-start: 1;
			grid-row: span 1;
			grid-column: span 12;
		}
	}
	.card {
		background-color: var(--theme-neutral-100);
		border: solid 1px var(--theme-neutral-300);
		border-radius: var(--rounded-md);
		&__header {
			padding: var(--spacing-unit);
			background-color: var(--theme-neutral-300);
		}
		&__content {
			padding: var(--spacing-unit);
		}
	}
	.variable__attribute {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-unit);
		background-color: var(--theme-neutral-300);
		border-radius: var(--rounded-full);
		margin-left: var(--spacing-unit);
		width: 1rem;
		height: 1rem;
	}
	.expand {
		transition: transform 0.3s ease-out;
	}
	.expand--open {
		transform: rotate(180deg);
	}
</style>
