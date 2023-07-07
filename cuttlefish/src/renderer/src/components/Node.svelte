<script lang="ts">
  import Device from "./Device.svelte"
  import Metric from "./Metric.svelte"

  export let node
  export let group
  export let unborn:boolean = false
  function requestRebirth(groupId, nodeId) {
    //@ts-ignore
    window.api.requestRebirth(groupId, nodeId)
  }
</script>

<div class="node">
  <div class="node__header__bar">
    <h3 class="node__header">{node.id}</h3>
    {#if unborn}<div>
      <span class="node__unborn">Unborn</span>
      <button on:click={ () => { requestRebirth(group.id, node.id) }}>Request Rebirth</button>
    </div>{/if}
  </div>
  <p class="node__section-title">Metrics</p>
  <div class="node__metrics">
    {#if node.metrics && node.metrics.length > 0}
      {#each node.metrics as metric}
        <Metric { metric }/>
      {/each}
    {:else}
      <p class="no-data">No metrics received yet.</p>
    {/if}
  </div>
  <p class="node__section-title">Devices</p>
  {#each node.devices as device}
    <Device { device }/>
  {/each}
  {#each node.unbornDevices as device}
    <Device { device } unborn = { true } />
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
      background-color: var(--gray-300);
      &__bar {
        display: flex;
        justify-content: space-between;
      }
      font-size: var(--text-sm);
      line-height: var(--text-sm-lh);
      padding-top: calc(var(--spacing-unit)*1);
      padding-bottom: calc(var(--spacing-unit)*1);
      padding-left: calc(var(--spacing-unit)*3);
      padding-right: calc(var(--spacing-unit)*3);
      border-bottom-right-radius: var(--rounded-md);
    }
  }
</style>