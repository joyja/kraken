<script lang="ts">
  import { enhance } from '$app/forms'
  import Moon from './icons/Moon.svelte'
  import Sun from './icons/Sun.svelte'
  export let theme: string
  export let action = 'setTheme'
</script>

<form method="POST" action={`?/${action}`} use:enhance>
  <input
    type="hidden"
    name="theme"
    value={theme === 'themeDark' ? 'themeLight' : 'themeDark'}
  />
  <button class="button--icon button__dark-mode"
    >{#if theme === 'themeDark'}<Moon />{:else}<Sun />{/if}</button
  >
</form>
