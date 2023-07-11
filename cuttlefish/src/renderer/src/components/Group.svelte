<script lang="ts">
  import Node from "./Node.svelte";
  export let group
</script>

<div class="group">
  <h2>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>apps</title><path d="M16,20H20V16H16M16,14H20V10H16M10,8H14V4H10M16,8H20V4H16M10,14H14V10H10M4,14H8V10H4M4,20H8V16H4M10,20H14V16H10M4,8H8V4H4V8Z" /></svg>
    {group.id}
  </h2>
  {#each group.nodes as node}
    <div>
      <Node { node } { group }/>
    </div>
  {/each}
  {#each group.unbornNodes as node}
    <div>
      <Node { node } { group } unborn={ true }/>
    </div>
  {/each}
</div>

<style lang="scss">
  .group {
    background-color: var(--white);
    box-shadow: var(--shadow-md);
    border-radius: var(--rounded-md);
    padding: calc(var(--spacing-unit) * 3);
    margin-bottom: calc(var(--spacing-unit)*3);
    & > h2 {
      display:flex;
      align-items: center;
      & > svg {
        height:20px; 
        width:20px;
        margin-right: var(--spacing-unit);
      }
      font-size: var(--text-sm);
      line-height: var(--text-sm-lh);
      margin-bottom: calc(var(--spacing-unit)*3);
    }
    & > div {
      margin-top: calc(var(--spacing-unit)*3);
    }
    & > div:first-child {
      margin-top: 0px;
    }
  }
</style>