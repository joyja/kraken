<script lang="ts">
  import Node from "./Node.svelte";
  export let group
</script>

<div class="group">
  <h2>{group.id}</h2>
  {#each group.nodes as node}
    <Node { node } { group }/>
  {/each}
  {#each group.unbornNodes as node}
    <Node { node } { group } unborn={ true }/>
  {/each}
</div>

<style lang="scss">
  .group {
    background-color: var(--white);
    box-shadow: var(--shadow-md);
    border-radius: var(--rounded-md);
    padding: calc(var(--spacing-unit) * 3);
    & > h2 {
      font-size: var(--text-sm);
      line-height: var(--text-sm-lh);
      margin-bottom: calc(var(--spacing-unit)*3);
    }
  }
</style>