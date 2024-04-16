<script>
  import '@fontsource/oswald'
  import { page } from '$app/stores'
  import Logo from '$lib/components/Logo.svelte'
  import Bell from '$lib/components/icons/Bell.svelte'
  import Chart from '$lib/components/icons/Chart.svelte'
  import ChevronRight from '$lib/components/icons/ChevronRight.svelte'
  import Squares from '$lib/components/icons/Squares.svelte'
  import { ThemeButton, Toast, client } from 'kraken-salt'
  import 'kraken-salt/styles.scss'
  export let data
  const { setTheme } = client

  let showMenu = false
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
<div class="menu" class:menu--closed={!showMenu}>
  <button
    class="button--menu"
    class:button--rotated={showMenu}
    style="height: 1.75rem; width: 1.75rem;"
    on:click={() => {
      showMenu = !showMenu
    }}
  >
    <ChevronRight size="2rem" />
  </button>
  <ul>
    <li>
      <a href={`/`}><Squares />Space</a>
    </li>
    <li>
      <a href={`/alarms`}><Bell />Alarms</a>
    </li>
    <li>
      <a href={`/history`}><Chart />History</a>
    </li>
  </ul>
</div>
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
  .button--menu {
    position: absolute;
    top: -1.5rem;
    right: -1.5rem;
    transition: all 0.3s ease-out;
    background-color: var(--theme-neutral-300);
    aspect-ratio: 1;
    height: calc(1rem + var(--spacing-unit) * 2);
    width: calc(1rem + var(--spacing-unit) * 2);
    color: var(--theme-neutral-600);
    background-color: var(--theme-neutral-300);
    border: solid 1px var(--theme-neutral-400);
    border-top-right-radius: var(--rounded-full);
    border-bottom-right-radius: var(--rounded-full);
    padding: calc(var(--spacing-unit));
    display: flex;
    justify-content: center;
    transition: all 0.3s ease-out;
    align-items: center;
  }
  .button--menu:hover {
    color: white;
    background-color: var(--theme-primary);
  }
  .menu {
    position: fixed;
    top: 5rem;
    left: 0;
    bottom: 0;
    width: 125px;
    /* background-color: #fff; */
    /* box-shadow: 0 0 10px rgba(0, 0, 0, 0.2); */
    z-index: 100;
    transition: transform 0.3s ease-out;
    display: flex;
    flex-direction: column;
    & > ul {
      list-style: none;
      padding: 0;
      margin: var(--spacing-unit);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-unit);
      & > li {
        & > a {
          background-color: var(--theme-neutral-300);
          padding: 0.5rem 1rem;
          border-radius: var(--rounded-full);
          border: solid 1px var(--theme-neutral-400);
          box-shadow: var(--shadow-lg);
          color: var(--theme-neutral-600);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: var(--spacing-unit);
          transition: all 0.3s ease-out;
          &:hover {
            background-color: var(--theme-primary);
            color: var(--white);
          }
        }
      }
    }
  }
  .menu--closed {
    transform: translateX(-100%);
  }
  .button--rotated {
    transform: rotate(180deg);
    border-top-left-radius: var(--rounded-full);
    border-bottom-left-radius: var(--rounded-full);
  }
</style>
