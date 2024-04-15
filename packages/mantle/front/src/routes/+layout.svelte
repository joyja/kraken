<script>
  import '@fontsource/oswald'
  import { page } from '$app/stores'
  import Logo from '$lib/components/Logo.svelte'
  import { ThemeButton, Toast, client } from 'kraken-salt'
  import 'kraken-salt/styles.scss'
  export let data
  const { setTheme } = client

  $: if ($page.form) setTheme($page.form)
</script>

<header>
  <nav>
    <a class="logo space-x-1 p-1 align-center" href="/"
      ><div style="width:30px;"><Logo /></div>
      <div class="logo__text">Mantle</div></a
    >
    <ThemeButton theme={data.theme} />
  </nav>
</header>
<slot />
<Toast />

<style lang="scss">
  header {
    & > nav {
      display: flex;
      justify-content: space-between;
    }
    padding: var(--spacing-unit);
  }
  .logo,
  .logo:link,
  .logo:visited,
  .logo:hover,
  .logo:active {
    display: flex;
    font-family: 'Oswald', sans-serif;
    text-transform: uppercase;
    text-decoration: none;
    color: var(--theme-neutral-700);
    font-size: 2rem;
    line-height: 2rem;
  }
</style>
