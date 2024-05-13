<script lang="ts">
	import type { PageData } from './$types';
	import Link from '$lib/components/icons/Link.svelte';
	import { format } from 'date-fns';
	import ChevronDown from '$lib/components/icons/ChevronDown.svelte';
	import { blur, slide } from 'svelte/transition';
	import { enhance } from '$app/forms';
	// Using ES6 import syntax
	import hljs from 'highlight.js/lib/core';
	import javascript from 'highlight.js/lib/languages/javascript';
	import typescript from 'highlight.js/lib/languages/typescript';
	import DocumentPlus from '$lib/components/icons/DocumentPlus.svelte';
	import DocumentMinus from '$lib/components/icons/DocumentMinus.svelte';
	import Pencil from '$lib/components/icons/Pencil.svelte';
	import Toggle from '$lib/components/Toggle.svelte'
	import Xmark from '$lib/components/icons/Xmark.svelte'
	import { onMount } from 'svelte'
	
	let editVariable:string | null = null
	let editVariableValue:string | null = null
	let variableFilter:string | null = null
	
	// Then register the languages you need
	hljs.registerLanguage('javascript', javascript);
	hljs.registerLanguage('typescript', typescript);
	
	export let data: PageData;
	let variables = data?.variables
	export let form;
	$: if (form?.context === 'setTheme') {
		if (form?.theme === 'themeDark') {
			document.body.classList.add('themeDark');
			document.body.classList.remove('themeLight');
		} else {
			document.body.classList.remove('themeDark');
			document.body.classList.add('themeLight');
		}
	}
	$: if (form?.context === 'setValue') {
		if (form?.type === 'success') {
			editVariable = null
			editVariableValue = null
		}
	}
	$: filteredVariables = variables.filter((variable:{name:string, description:string}) => {
		return variable.name.toLowerCase().includes(variableFilter?.toLowerCase() || '') || variable.description.toLowerCase().includes(variableFilter?.toLowerCase() || '')
	})
	let codes = [
		...data.programs.map((program:Program) => {
			return { name: program, type: 'program', visible: false, code: '' };
		}),
		...data.classes.map((tClass:TClass) => {
			return { name: tClass.name, type: 'class', visible: false, code: '' };
		})
	];
	$: if (form?.context === 'getCode') {
		codes = codes.map((code) => {
			return code.name === form?.name
				? {
						...code,
						visible: form?.visible,
						code: hljs.highlight(form?.program, { language: 'typescript' }).value
				  }
				: { ...code, visible: false };
		});
	}
	$: tasks = data?.config?.tasks?.map((task:Task) => {
		return {
			...task,
			...data?.metrics?.find((metric:Metric) => {
				return task.name === metric.task;
			})
		};
	});
	function subscribe() {
		const sse = new EventSource('/api/sse/values');
		sse.onmessage = (e) => {
			variables = JSON.parse(e.data).variables
		}
		return () => sse.close();
	}
	onMount(subscribe)
</script>

<!-- <pre>{JSON.stringify(data, null, 2)}</pre> -->
{#if !data.tentacleStatus.connected}
	<div class="overlay" transition:blur>
		<div class="overlay__content">
			<div class="overlay__header">
				Cannot connect to Tentacle PLC
			</div>
			<div class="overlay__body">
				please check your network connection and that Tentacle PLC is running.
			</div>
		</div>
	</div>
{/if}
<main>
	<div class="card changes">
		<p class="card__header">Changes</p>
		<ul class="card__content space-y-3">
			{#if data?.changes && data.changes.length > 0}
				{#each data?.changes || [] as change}
					<li class="flex align-center space-x-1">
						<div>
							{#if change.event === 'add'}
								<DocumentPlus />
							{:else if change.event === 'unlink'}
								<DocumentMinus />
							{:else if change.event === 'change'}
								<Pencil />
							{:else}
								<div style="width: 1.5rem;" />
							{/if}
						</div>
						<div class="flex flex-column change">
							<div>{format(change.timestamp, 'yyyy-MM-dd HH:mm:ss')}</div>
							<div>{change.path}</div>
						</div>
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
			{#if tasks}
				{#each tasks || [] as task}
					<li class="flex flex-column">
						<div class="flex align-center justify-between">
							<div class="flex flex-column">
								<div>{task.name}</div>
								<div class="subtext">{task.program}.ts</div>
								<div class="subtext">{task.description}</div>
							</div>
							<div class="pill">{task.scanRate}ms</div>
						</div>
						<div class="flex justify-between mt-1">
							<div class="text-xs">{task?.intervalExecutionTime?.toFixed(2)}ms</div>
							<div class="text-xs">{task?.overheadExecutionTime?.toFixed(2)}ms</div>
							<div class="text-xs">{task?.functionExecutionTime?.toFixed(2)}ms</div>
						</div>
						<div class="flex metric-bar">
							<div
								style:flex-basis="{task
									? (task.intervalExecutionTime /
											(task.intervalExecutionTime + task.overheadExecutionTime + task.functionExecutionTime)) *
									  100
									: 100}%"
							/>
							<div
								style:flex-basis="{task
									? (task.overheadExecutionTime /
											(task.intervalExecutionTime + task.overheadExecutionTime + task.functionExecutionTime)) *
									  100
									: 100}%"
							/>
							<div
								style:flex-basis="{task
									? (task.functionExecutionTime /
											(task.intervalExecutionTime + task.overheadExecutionTime + task.functionExecutionTime)) *
									  100
									: 0}%"
							/>
						</div>
					</li>
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
					<li>
						<div>{mqtt.name}</div>
						<div class="subtext">{mqtt.description}</div>
						<div class="subtext">{mqtt.config.serverUrl}</div>
					</li>
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
				<li>
					<div>{modbus.name}</div>
					<div class="subtext">{modbus.description}</div>
					<div class="subtext">{modbus.config.serverUrl}</div>
				</li>
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
				<li>
					<div>{opcua.name}</div>
					<div class="subtext">{opcua.description}</div>
					<div class="subtext">{opcua.config.serverUrl}</div>
				</li>
				{/each}
			{:else}
				There are no OPCUA connections configured.
			{/if}
		</ul>
	</div>
	<div class="card variables">
		<div class="card__header">
			<span>
				Variables
			</span>
			<input type="text" placeholder="Filter" bind:value={variableFilter}/>
		</div>
		<ul class="card__content banded">
			{#if variables}
				{#each filteredVariables || [] as variable}
					<li class="variable" transition:slide>
						<div class="flex variable__attributes">
							{variable.name}
							{#if variable.persistent}<div class="variable__attribute variable__attribute--icon">P</div>{/if}
							{#if variable.source}<div class="variable__attribute variable__attribute--icon"><Link /></div>{/if}
							<div class="variable__attribute">{variable?.changeEvents?.inLastHour || 0} / Hr</div>
						</div>
						<div class="variable__description">{variable.description}</div>
						{#if variable.datatype === 'boolean'}
							<form class="variable__value flex justify-center" method="POST" action="?/setValue" use:enhance>
								<Toggle id={variable.name} checked={variable.value === 'true'} name="value" selector={variable.path} selectorName="variablePath" buttonType="submit"/>
							</form>
						{:else}
							<div class="variable__value">
								<button on:click={() => { editVariable = variable.name; editVariableValue = variable.value }}>
									{variable.decimals ? parseFloat(variable.value).toFixed(variable.decimals) : variable.value }
								</button>
								{#if editVariable === variable.name}
									<form method="POST" action="?/setValue" use:enhance class="variable__editor space-x-1 align-center" transition:blur>
										<input name="variablePath" type="hidden" value={variable.path}/> 
										<input name="value"type="text" value={editVariableValue}/>
										<button type="submit" class="button--icon"><Pencil /></button>
										<button type="button" class="button--icon" on:click={() => {editVariable = null}}><Xmark /></button>
									</form>
								{/if}
							</div>
						{/if}
					</li>
				{/each}
			{:else}
				There are no variables configured.
			{/if}
		</ul>
	</div>
	{#if codes && codes.length > 0}
		<div class="codes space-y-1">
			{#each codes || [] as code}
				<div class="card code">
					<div class="card__header flex align-center justify-between">
						<div class="flex align-center">
							<a class="button button--icon" href={data.codeserverEndpoint}><Pencil /></a
							>{code.name}
						</div>
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
	.overlay {
		z-index: 5;
		display: flex;
		align-items: center;
		justify-content: center;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(128, 128, 128, 0.5);
		&__content {
			text-align: center;
			background-color: var(--red-100);
			color: var(--red-500);
			padding: calc(var(--spacing-unit)*2);
			border-radius: var(--rounded-md);
			border: var(--red-500);
		}
		&__header {
			font-size:var(--text-xl);
		}
		&__body {
			font-size:var(--text-md);
		}
	}
	.button--icon {
		color: var(--theme-neutral-900);
		border-radius: var(--rounded-full);
	}
	.banded {
		padding: 0 !important;
		& > *:nth-child(even) {
			background-color: var(--theme-neutral-200);
		}
	}
	.change {
		> div {
			&:first-child {
				color: var(--neutral-500);
				font-size: var(--text-xs);
				line-height: var(--text-xs-lh);
			}
		}
	}
	.metric-bar {
		> div {
			height: var(--spacing-unit);
			&:first-child {
				background-color: var(--neutral-400);
			}
			&:nth-child(2) {
				background-color: var(--fuchsia-500);
			}
			&:last-child {
				background-color: var(--theme-accent);
			}
		}
	}
	.text-xs {
		font-size: var(--text-xs);
	}
	.pill {
		color: var(--theme-neutral-600);
		border: solid 1px var(--theme-neutral-400);
		background-color: var(--theme-neutral-200);
		padding: var(--spacing-unit) var(--spacing-unit);
		border-radius: var(--rounded-full);
		font-size: var(--text-xs);
	}
	.subtext {
		font-size: var(--text-xs);
		color: var(--theme-neutral-600);
	}
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
		grid-row: span 6;
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
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: var(--spacing-unit);
			background-color: var(--theme-neutral-300);
			& > input {
				width: 180px;
			}
		}
		&__content {
			font-size: var(--text-md);
			color: var(--theme-neutral-700);
			padding: var(--spacing-unit);
		}
	}
	.variable {
		display: grid;
		grid-template-columns: 1fr 120px;
		padding: var(--spacing-unit);
	}
	.variable__attributes {
		grid-row-start: 1;
		grid-column-start: 1;
	}
	.variable__attribute {
		font-size: var(--text-xs);
		line-height: var(--text-xs-lh);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: calc(var(--spacing-unit) * 0.5);
		background-color: var(--theme-neutral-300);
		border-radius: var(--rounded-full);
		margin-left: var(--spacing-unit);
		min-width: 1rem;
	}
	.variable__attribute--icon {
		width: 1rem;
		height: 1rem;
	}
	.variable__description {
		color: var(--theme-neutral-600);
		font-size: var(--text-xs);
		line-height: var(--text-xs-lh);
		grid-row-start: 2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.variable__value {
		position: relative;
		display: flex;
		align-items: center;
		text-align: end;
		grid-row-start: 1;
		grid-row: span 2;
		& > button {
			color: var(--theme-neutral-950);
			flex-grow: 1;
			background-color: transparent;
			transition: background-color 0.3s ease-out;
		}
		& > button:hover {
			background-color: var(--theme-primary);
		}
	}
	.variable__editor {
		position: absolute;
		display: flex;
		left: -150px;
		right: calc(100% + 1*var(--spacing-unit)) ;
		top: 0;
		height: 100%;
		& > input {
			text-align: center;
		}
	}
	.expand {
		transition: transform 0.3s ease-out;
	}
	.expand--open {
		transform: rotate(180deg);
	}
</style>
