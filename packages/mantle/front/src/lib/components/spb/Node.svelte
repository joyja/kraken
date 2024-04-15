<script lang="ts">
  import { slide } from 'svelte/transition'
  import Device from './Device.svelte'
  import Metric from './Metric.svelte'
  import { enhance } from '$app/forms'

  export let node
  export let group
  let expanded = false
  $: metrics = {
    commands: node.metrics.filter((metric) => {
      return metric.id.includes('Node Control')
    }),
    info: node.metrics.filter((metric) => {
      return metric.id.includes('Node Info')
    }),
    templates: node.metrics.filter((metric) => {
      return (
        metric.value !== null &&
        typeof metric.value === 'object' &&
        metric.value['isDefinition']
      )
    }),
    data: node.metrics.filter((metric) => {
      return (
        !metric.id.includes('Node Info') &&
        !metric.id.includes('Node Control') &&
        !(
          metric.value !== null &&
          typeof metric.value === 'object' &&
          metric.value['isDefinition']
        )
      )
    }),
  }
  export let unborn: boolean = false
</script>

<div class="node">
  <div class="node__header__bar">
    <h3 class="node__header" class:node__header--expanded={expanded}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
        ><title>record-circle-outline</title><path
          fill="var(--theme-neutral-950)"
          d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z"
        /></svg
      >
      {node.id}
    </h3>
    {#if unborn}
      <div>
        <span class="node__unborn">Unborn</span>
        <form method="POST" action="?/sendNodeCommand" use:enhance>
          <input type="hidden" id="group-id" name="group-id" value={group.id} />
          <input type="hidden" id="node-id" name="node-id" value={node.id} />
          <input
            type="hidden"
            id="metric-id"
            name="metric-id"
            value={`Node Control/Rebirth`}
          />
          <button class="button--primary">Rebirth</button>
        </form>
      </div>
    {/if}
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
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M19.5 8.25l-7.5 7.5-7.5-7.5"
        />
      </svg>
    </button>
  </div>
  {#if expanded}
    <div transition:slide>
      <p class="node__section-title">Metrics</p>
      <div class="node__metrics">
        {#if metrics.data && metrics.data.length > 0}
          {#each metrics.data as metric}
            <Metric {metric} />
          {/each}
        {:else}
          <p class="no-data">No metrics received yet.</p>
        {/if}
      </div>
      <div class="node__meta">
        <div class="node__meta__group">
          <p class="node__meta__group__title">Info</p>
          <div class="node__meta__group__data">
            {#if metrics.info && metrics.info.length > 0}
              {#each metrics.info as metric}
                <Metric
                  metric={{
                    ...metric,
                    id: metric.id.replace('Node Info/', ''),
                  }}
                />
              {/each}
            {:else}
              <p class="no-data">No metrics received yet.</p>
            {/if}
          </div>
        </div>
        <div class="node__meta__group">
          <p class="node__meta__group__title">Commands</p>
          <div class="node__meta__group__data">
            {#if metrics.commands && metrics.commands.length > 0}
              {#each metrics.commands as metric}
                <form
                  class="flex-responsive-column"
                  method="POST"
                  action="?/sendNodeCommand"
                  use:enhance
                >
                  <input
                    type="hidden"
                    id="group-id"
                    name="group-id"
                    value={group.id}
                  />
                  <input
                    type="hidden"
                    id="node-id"
                    name="node-id"
                    value={node.id}
                  />
                  <input
                    type="hidden"
                    id="metric-id"
                    name="metric-id"
                    value={metric.id}
                  />
                  <button class="button--primary"
                    >{metric.id.replace('Node Control/', '')}</button
                  >
                </form>
              {/each}
            {:else}
              <p class="no-data">No metrics received yet.</p>
            {/if}
          </div>
        </div>
      </div>
      <p class="node__section-title">Devices</p>
      {#each node.devices as device}
        <Device {group} {node} {device} />
      {/each}
      {#each node.unbornDevices as device}
        <Device {group} {node} {device} unborn={true} />
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  .no-data {
    color: var(--theme-neutral-500);
    font-size: var(--text-xs);
    line-height: var(--text-xs-lh);
  }
  .node {
    background-color: var(--theme-neutral-50);
    border: solid 1px var(--theme-neutral-300);
    border-radius: var(--rounded-md);
    container: node / inline-size;
    &__meta {
      display: flex;
      margin: calc(var(--spacing-unit) * 1.5);
      flex-wrap: wrap;
      @container (max-width: 600px) {
        flex-direction: column;
      }
      &__group {
        &__title {
          padding-left: var(--spacing-unit);
          background-color: var(--theme-neutral-300);
        }
        flex-grow: 1;
        flex-shrink: 1;
        border-radius: var(--rounded-md);
        border: solid 1px var(--theme-neutral-300);
        &__data {
          margin: calc(var(--spacing-unit) * 0.5);
          & > button {
            margin: calc(var(--spacing-unit) * 0.5);
          }
          // container: node__meta__group__data / inline-size;
        }
      }
      & > * {
        margin: calc(var(--spacing-unit) * 1.5);
        margin: calc(var(--spacing-unit) * 1.5);
      }
    }
    &__section-title {
      padding-left: calc(var(--spacing-unit) * 3);
      padding-right: calc(var(--spacing-unit) * 3);
      font-size: var(--text-sm);
      // font-weight: var(--font-bold);
      line-height: var(--text-sm-lh);
      border-bottom: solid 1px var(--theme-neutral-300);
    }
    &__metrics {
      margin: calc(var(--spacing-unit) * 3);
    }
    &__unborn {
      padding-top: calc(var(--spacing-unit) * 3);
      padding-right: calc(var(--spacing-unit) * 3);
      color: var(--orange-500);
    }
    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-basis: 150px;
      flex-shrink: 0;
      & > svg {
        height: 24px;
        width: 24px;
        margin-right: var(--spacing-unit);
      }
      background-color: var(--theme-neutral-300);
      &__bar {
        & > button {
          display: flex;
          flex-direction: column;
          justify-content: center;
          color: var(--theme-neutral-600);
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
        & > div {
          margin: var(--spacing-unit);
          & > button {
            font-size: var(--text-xs);
            line-height: var(--text-xs-lh);
          }
        }
        display: flex;
        // align-items: center;
        justify-content: space-between;
      }
      font-size: var(--text-sm);
      line-height: var(--text-sm-lh);
      padding-top: calc(var(--spacing-unit) * 1);
      padding-bottom: calc(var(--spacing-unit) * 1);
      padding-left: calc(var(--spacing-unit));
      padding-right: calc(var(--spacing-unit) * 3);
      border-bottom-right-radius: 0px;
      margin-bottom: 0px;
      transition: all 0.3s ease-out;
      &--expanded {
        margin-bottom: calc(var(--spacing-unit));
        border-bottom-right-radius: var(--rounded-md);
      }
    }
  }
  .flex-responsive-column {
    display: flex;
    flex-direction: row;
    @container (max-width: 600px) {
      flex-direction: column;
    }
  }
</style>
