<script lang="ts">
  import Device from "./Device.svelte"
  import Metric from "./Metric.svelte"

  export let node
  export let group
  $: metrics = {
    commands: node.metrics.filter((metric) => {
      return metric.id.includes('Node Control')
    }),
    info: node.metrics.filter((metric) => {
      return metric.id.includes('Node Info')
    }),
    templates: node.metrics.filter((metric) => {
      return typeof metric.value === 'object' && metric.value['isDefinition']
    }),
    data: node.metrics.filter((metric) => {
      return !metric.id.includes('Node Info') && !metric.id.includes('Node Control') && !(typeof metric.value === 'object' && metric.value['isDefinition'])
    })
  }
  export let unborn:boolean = false
  function requestRebirth(groupId, nodeId) {
    //@ts-ignore
    window.api.requestRebirth(groupId, nodeId)
  }
  function sendNodeCommand(groupId, nodeId, metricId) {
    //@ts-ignore
    window.api.sendNodeCommand(groupId, nodeId, metricId, true)
  }
</script>

<div class="node">
  <div class="node__header__bar">
    <h3 class="node__header">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>record-circle-outline</title><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" /></svg>
      {node.id}
    </h3>
    {#if unborn}
    <div>
      <span class="node__unborn">Unborn</span>
      <button class="button--primary" on:click={ () => { requestRebirth(group.id, node.id) }}>Request Rebirth</button>
    </div>
    {/if}
  </div>
  <p class="node__section-title">Metrics</p>
  <div class="node__metrics">
    {#if metrics.data && metrics.data.length > 0}
      {#each metrics.data as metric}
        <Metric { metric }/>
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
            <Metric metric = { {...metric, id: metric.id.replace('Node Info/','')} }/>
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
            <button class="button--primary" on:click={ ()=>{ sendNodeCommand(group.id, node.id, metric.id)} }>{metric.id.replace('Node Control/','')}</button>
          {/each}
        {:else}
          <p class="no-data">No metrics received yet.</p>
        {/if}
      </div>
    </div>
  </div>
  <p class="node__section-title">Devices</p>
  {#each node.devices as device}
    <Device { group } { node } { device }/>
  {/each}
  {#each node.unbornDevices as device}
    <Device { group } { node } { device } unborn = { true } />
  {/each}
</div>

<style lang="scss">
  .no-data {
    color: var(--gray-500);
    font-size: var(--text-xs);
    line-height: var(--text-xs-lh);
  }
  .node {
    background-color: var(--white);
    border: solid 1px var(--gray-300);
    border-radius: var(--rounded-md);
    &__meta {
      display: flex;
      margin: calc(var(--spacing-unit)*1.5);
      flex-wrap: wrap;
      &__group {
        &__title {
          padding-left: var(--spacing-unit);
          background-color: var(--gray-300);
        }
        flex-grow:1;
        flex-shrink:1;
        border-radius: var(--rounded-md);
        border: solid 1px var(--gray-300);
        &__data {
          margin: calc(var(--spacing-unit)*0.5);
          & > button {
            margin: calc(var(--spacing-unit)*0.5);
          }
        }
      }
      & > * {
        margin: calc(var(--spacing-unit) * 1.5);
        margin: calc(var(--spacing-unit) * 1.5); 
      }
    }
    &__section-title {  
      padding-left: calc(var(--spacing-unit)*3);
      padding-right: calc(var(--spacing-unit)*3);
      font-size: var(--text-sm);
      // font-weight: var(--font-bold);
      line-height: var(--text-sm-lh);
      border-bottom: solid 1px var(--gray-300);
    }
    &__metrics {
      margin: calc(var(--spacing-unit)*3);
    }
    &__unborn {
      padding-top: calc(var(--spacing-unit)*3);
      padding-right: calc(var(--spacing-unit)*3);
      color: var(--orange-500);
    }
    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      & > svg {
        height: 24px;
        width: 24px;
        margin-right: var(--spacing-unit);
      }
      background-color: var(--gray-300);
      &__bar {
        & > div {
          margin: var(--spacing-unit);
          & > button {
            font-size: var(--text-xs);
            line-height: var(--text-xs-lh);
          }
        }
        display: flex;
        justify-content: space-between;
      }
      font-size: var(--text-sm);
      line-height: var(--text-sm-lh);
      padding-top: calc(var(--spacing-unit)*1);
      padding-bottom: calc(var(--spacing-unit)*1);
      padding-left: calc(var(--spacing-unit));
      padding-right: calc(var(--spacing-unit)*3);
      border-bottom-right-radius: var(--rounded-md);
    }
  }
  button {
    cursor: pointer;
    border: none;
    color: white;
    border-radius: var(--rounded-md);
    padding: calc(var(--spacing-unit) * 1);
  }
  .button--primary {
    background-color: var(--teal-600);
  }
  .button--primary:hover {
    background-color: var(--teal-700);
  }
</style>