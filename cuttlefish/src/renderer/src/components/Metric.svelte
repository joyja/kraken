<script lang="ts">
  import Long from "long"

  export let metric
  function parseMetricValue(value) {
    if (typeof value === 'object' && Object.hasOwn(value, 'high') && Object.hasOwn(value, 'low') && Object.hasOwn(value, 'unsigned')) {
      return new Long(value.low, value.high, value.unsigned).toNumber()
    } else {
      return value
    }
  }
</script>

<div class="metric">
  <span class="metric__header">{metric.id}</span>
  {#if Object.hasOwn(metric.value,'isDefinition')}
    <button>Template</button>
    <!-- <pre>{ JSON.stringify(metric.value,null,4)}</pre> -->
  {:else}
    <span class="metric__value">{parseMetricValue(metric.value)}</span>
  {/if}
</div>

<style lang="scss">
  .metric {
    display: flex;
    justify-content: space-between;
    width: 100%;
    &__header {
      flex-basis: 500px;
      font-size: var(--text-sm);
      line-height: var(--text-sm-lh);
      // flex-shrink: 0;
      // flex-grow: 0;
    }
    &__value {
      font-size: var(--text-sm);
      line-height: var(--text-sm-lh);
      text-align: right;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-basis: 500px;
      flex-shrink: 1;
      flex-grow: 1;
    }
  }
</style>