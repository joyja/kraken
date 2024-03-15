<script lang="ts">
  import Node from "./Node.svelte";
  import { slide } from "svelte/transition"
  export let group
  let expanded = false
</script>

<div class="group" class:group--expanded={expanded}>
  <div class="header">
    <h2>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>apps</title><path d="M16,20H20V16H16M16,14H20V10H16M10,8H14V4H10M16,8H20V4H16M10,14H14V10H10M4,14H8V10H4M4,20H8V16H4M10,20H14V16H10M4,8H8V4H4V8Z" /></svg>
      {group.id}
    </h2>
    <button on:click={ () => { expanded = !expanded } }>
      <svg class:expanded={ expanded } xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </button>
  </div>
  {#if expanded}
    <div transition:slide class="children">
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
  {/if}
</div>

<style lang="scss">
  .header {
    display: flex;
    justify-content: space-between;
    & > button {
      color: var(--teal-600);
      background-color: transparent;
      border: none;
      cursor: pointer;
      & > svg {
        height: 24px;
        width: 24px;
        transition: transform .3s ease-out;
      }
      & > .expanded {
        transform: rotate(90deg);
      }
      margin-bottom: calc(var(--spacing-unit)*3);
    }
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
  }
  .group {
    background-color: var(--white);
    box-shadow: var(--shadow-md);
    border-radius: var(--rounded-md);
    padding-top: calc(var(--spacing-unit) * 3);
    padding-left: calc(var(--spacing-unit) * 3);
    padding-right: calc(var(--spacing-unit) * 3);
    padding-bottom: 0px;
    &--expanded {
      padding-bottom: calc(var(--spacing-unit) * 3);
    }
    & > .children {
      & > div {
        margin-top: calc(var(--spacing-unit)*3);
      }
      & > div:first-child {
        margin-top: 0px;
      }
    }
  }
</style>