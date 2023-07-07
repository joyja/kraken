<script lang="ts">
  import { slide } from "svelte/transition"
  import Group from "./components/Group.svelte";
  import Setup from "./components/Setup.svelte"
  let groups
  //@ts-ignore
  window.api.handleGroups((_event, value) => {
    groups = value
  })
</script>

<div class="container">
  <div><Setup /></div>
  {#if groups }
    {#each groups as group}
      <div transition:slide|global><Group { group }/></div>
    {/each}
  {/if}
</div>

<style lang="scss">
  :global(body) {
    background-color: var(--gray-200);
  }
  .container {
    flex: 1;
    display: flex;
    flex-direction: column;
    max-width: 840px;
    margin: 0 auto;
    padding: 15px 30px 0 30px;
    & > div:first-child {
      margin-top:0px;
    }
    & > div {
      margin-top: var(--spacing-unit);
      margin-bottom: var(--spacing-unit);
    }
    & > div:last-child {
      margin-bottom:0px;
    }
  }
</style>
