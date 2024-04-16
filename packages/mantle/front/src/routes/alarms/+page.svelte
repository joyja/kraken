<script>
  export let data
  import { format } from 'date-fns'
</script>

<div class="flex justify-center">
  <div class="felx flex-grow-0 flex-shrink-1" style="flex-basis: 1200px;">
    <ul>
      {#each data.alarmHistory as row}
        <li>
          <div>{row.alarm.name}</div>
          <div class="subtext">
            {format(row.timestamp, 'MM/dd/yyyy HH:mm:ss aa')}
          </div>
          <!-- <div>{row.alarm.priority}</div>
          <div>{row.acknowledged}</div>
          <div>{row.cleared}</div> -->
        </li>
      {/each}
    </ul>
  </div>
</div>

<style lang="scss">
  ul {
    border: solid 1px var(--theme-neutral-300);
    border-radius: var(--rounded-md);
    & > li {
      padding: var(--spacing-unit);
    }
    & > li:nth-child(even) {
      background-color: var(--theme-neutral-100);
    }
  }
  .subtext {
    font-size: var(--text-xs);
    line-height: var(--text-xs-lh);
    color: var(--theme-neutral-600);
  }
</style>
