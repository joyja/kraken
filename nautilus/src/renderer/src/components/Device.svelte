<script lang="ts">
  import Metric from "./Metric.svelte"

  export let device
  export let unborn = false
</script>

<div class="device">
  <div class="device__header__bar">
    <h4 class="device__header">{device.id}</h4>
    {#if unborn}<span class="device__unborn">Unborn</span>{/if}
  </div>
  {#each device.metrics as metric}
    <Metric { metric } />
  {/each}
</div>

<style lang="scss">
  .device {
    background-color: var(--white);
    margin-left: calc(var(--spacing-unit)*3); 
    margin-right: calc(var(--spacing-unit)*3); 
    margin-bottom: calc(var(--spacing-unit)*3); 
    margin-top: calc(var(--spacing-unit)*3); 
    &__unborn {
      color: var(--orange-500);
    }
    &__header {
      &__bar {
        display: flex;
        justify-content: space-between;
      }
      background-color: var(--gray-300);
      padding-left: calc(var(--spacing-unit)*3);
      padding-right: calc(var(--spacing-unit)*3);
      border-radius: var(--rounded-full);
      font-size: var(--text-sm);
      line-height: var(--text-sm-lh);
    }
  }
</style>