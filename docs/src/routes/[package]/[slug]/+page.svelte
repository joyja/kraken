<script lang="ts">
  import type { PageData } from './$types'

  export let data: PageData

  type C = $$Generic<typeof SvelteComponentTyped<any, any, any>>
  $: component = data.component as unknown as C
</script>

<svelte:component this={component} />
