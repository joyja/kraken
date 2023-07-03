<script lang="ts">
  let groups
  //@ts-ignore
  window.api.handleGroups((_event, value) => {
    groups = value
  })
</script>

<div class="container">
  {#if groups}
    {#each groups as group}
      <div class="card"><h2>{ group.id }</h2>
        <ul>
          {#each group.nodes as node}
          <li>
            <h3>{ node.id }</h3>
            <ul>
              {#each node.devices as device}
                <li>
                  <h4>{ device.id }</h4>
                  <ul>
                    {#each device.metrics as metric}
                      <li><div>{metric.id}</div><pre>{typeof metric.value === 'object' ? 'Template' : metric.value }</pre></li>
                    {/each}
                  </ul>
                </li>
              {/each}
            </ul>
          </li>
          {/each}
        </ul>
      </div>
    {/each}
  {/if}
</div>

<style lang="scss">
  .container {
    flex: 1;
    display: flex;
    flex-direction: column;
    max-width: 840px;
    margin: 0 auto;
    padding: 15px 30px 0 30px;
  }
  .card {
    box-shadow: var(--shadow-md);
    padding: calc(var(--spacing-unit) * 3);
    & > ul {
      padding: calc(var(--spacing-unit) * 3);
      & > li {
        & > ul {
          padding: calc(var(--spacing-unit) * 3);
          & > li {
            & > ul {
              padding: calc(var(--spacing-unit) * 3);
              & > li {
                display:flex;
                & > pre {
                  overflow:hidden;
                  text-overflow: ellipsis;
                }
                & > div:first-child {
                  flex-basis: 200px;
                  flex-shrink: 0;
                  flex-grow: 0;
                }
              }
            }
          }
        }
      }
    }
  }
</style>
