<script lang="ts">
  import Metric from "./Metric.svelte"

  export let device
  export let unborn = false

  $: metrics = {
    commands: device.metrics.filter((metric) => {
      return metric.id.includes('Device Control')
    }),
    data: device.metrics.filter((metric) => {
      return !metric.id.includes('Device Control')
    })
  }
</script>

<div class="device">
  <div class="device__header__bar">
    <h4 class="device__header">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>nas</title><path d="M4,5C2.89,5 2,5.89 2,7V17C2,18.11 2.89,19 4,19H20C21.11,19 22,18.11 22,17V7C22,5.89 21.11,5 20,5H4M4.5,7A1,1 0 0,1 5.5,8A1,1 0 0,1 4.5,9A1,1 0 0,1 3.5,8A1,1 0 0,1 4.5,7M7,7H20V17H7V7M8,8V16H11V8H8M12,8V16H15V8H12M16,8V16H19V8H16M9,9H10V10H9V9M13,9H14V10H13V9M17,9H18V10H17V9Z" /></svg>
      {device.id}
    </h4>
    {#if unborn}<span class="device__unborn">Unborn</span>{/if}
  </div>
  <div class="device__commands">
    {#each metrics.commands as metric}
      <button class="button--primary">{ metric.id.replace('Device Control/','') }</button>
    {/each}
  </div>
  <div class="device__metrics">
    {#each metrics.data as metric}
      <div>
        <Metric { metric } />
      </div>
    {/each}
  </div>
</div>

<style lang="scss">
  .device {
    background-color: var(--white);
    margin-left: calc(var(--spacing-unit)*3); 
    margin-right: calc(var(--spacing-unit)*3); 
    margin-bottom: calc(var(--spacing-unit)*3); 
    margin-top: calc(var(--spacing-unit)*3);
    border-radius: var(--rounded-md);
    border: solid 1px var(--gray-300);
    &__commands {
      background-color: var(--gray-300);
      display: flex;
      justify-content: right;
      & > button {
        margin: calc(var(--spacing-unit)*0.5);
      }
    }
    &__unborn {
      color: var(--orange-500);
    }
    &__header {
      display: flex;
      align-items: center;
      & > svg {
        height: 24px;
        width: 24px;
        margin-right: calc(var(--spacing-unit));
      }
      &__bar {
        display: flex;
        justify-content: space-between;
        background-color: var(--gray-300);
      }
      padding-left: calc(var(--spacing-unit));
      padding-right: calc(var(--spacing-unit)*3);
      border-top-right-radius: var(--rounded-full);
      border-bottom-right-radius: var(--rounded-full);
      font-size: var(--text-sm);
      line-height: var(--text-sm-lh);
      margin-bottom: 0px; 
    }
    &__metrics {
      & > * {
        background-color: var(--transparent);
        padding: var(--spacing-unit);
      }
      & > *:nth-child(even){
        background-color: var(--gray-200);
      }
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