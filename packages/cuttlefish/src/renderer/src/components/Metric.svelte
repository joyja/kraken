<script lang="ts">
  import Long from "long"

  export let metric
  function parseMetricValue(value) {
    if (value && typeof value === 'object' && Object.hasOwn(value, 'high') && Object.hasOwn(value, 'low') && Object.hasOwn(value, 'unsigned')) {
      return new Long(value.low, value.high, value.unsigned).toNumber()
    } else {
      return value
    }
  }
</script>

<div class="metric">
  <div class="metric__update-count">{ metric.updateCount }</div>
  <span class="metric__header">{metric.id}</span>
  {#if metric.value && Object.hasOwn(metric.value,'isDefinition')}
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
    align-items: center;
    width: 100%;
    &__update-count {
      display: flex;
      justify-content: center;
      align-items: center;
      color: var(--gray-600);
      // background-color: var(--gray-400);
      border: solid 1px var(--gray-400);
      border-radius: var(--rounded-full);
      padding: 2px;
      font-size: var(--text-xs);
      line-height: var(--text-xs-lh);
      flex-basis: 2rem;
      flex-shrink: 0;
    }
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
    & > * {
      margin-left: var(--spacing-unit);
    }
    & > *:first-child {
      margin-left: 0px;
    }
  }
</style>