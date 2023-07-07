<script lang="ts">
  export let metric
</script>

<div class="metric">
  <span class="metric__header">{metric.id}</span>
  {#if Object.hasOwn(metric.value,'isDefinition')}
    <button>Template</button>
  {:else}
    <span class="metric__value">{metric.value}</span>
  {/if}
</div>

<style lang="scss">
  .metric {
    display: flex;
    justify-content: space-between;
    width: 100%;
    &__header {
      flex-basis: 300px;
      flex-shrink: 0;
      flex-grow: 0;
    }
    &__value {
      text-align: right;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-basis: 500px;
      flex-shrink: 1;
      flex-grow: 0;
    }
  }
</style>