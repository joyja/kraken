<script lang="ts">
  import 'salt/dist/styles/main.scss'
</script>

<div class="flex justify-center">
  <div
    class="flex flex-column flex-shrink-1 flex-grow-0 space-y-1"
    style="flex-basis: 1200px;"
  >
    <div class="flex"><Legend /></div>
    {#each $groups as group}
      <div><Group {group} /></div>
    {/each}
  </div>
</div>
