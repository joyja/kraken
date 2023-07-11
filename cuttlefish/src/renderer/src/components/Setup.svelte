<script lang="ts">
  import { onMount } from "svelte"
  import { slide } from "svelte/transition"

  let connections = []
  let serverUrl = null
  let username = null
  let password = null
  let selectedConnection
  let showAddConnection = false

  $: selectConnection(selectedConnection)


  async function getConnections() {
    //@ts-ignore
    const connections = await window.api.getConnections()
    return connections
  }
  async function addConnection() {
    //@ts-ignore
    window.api.addConnection({
      id: connections.length === 0 ? 1 : Math.max(...connections.map(connection => connection.id)) + 1,
      serverUrl,
      username,
      password,
    })
    //@ts-ignore
    connections = await window.api.getConnections()
  }
  async function selectConnection(id) {
    //@ts-ignore
    window.api.selectConnection(id)
  }
  async function deleteConnection(id) {
    //@ts-ignore
    window.api.deleteConnection(id)
    //@ts-ignore
    connections = await window.api.getConnections()
  }
  onMount(async () => {
    connections = await getConnections()
    if (connections && connections.length > 0) {
      selectedConnection = connections[0].id
    }
  })
</script>

<div class="connections"> 
  <h2>Connections</h2>
  <div class="connections__configurator">
    {#if connections && connections.length > 0}
      <fieldset class="connections__list">
        {#each connections as connection}
          <div class="connections__connection">
            <input type="radio" id={ `connection${connection.id}` } name={ `connection` } bind:group={ selectedConnection } value={ connection.id }/>
            <label for={ `connection${connection.id}` }>{connection.serverUrl}</label>
            <button class="button--icon" on:click={ ()=>{deleteConnection(connection.id)}}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        {/each}
      </fieldset>
    {:else}
      <p style="display:flex; align-items: center">There are no configured connections. Click the button to add one!
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="height: 20px; width: 20px; margin-left: var(--spacing-unit);">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </p>
    {/if}
    <button on:click={() => { showAddConnection = !showAddConnection }}>
      {#if !showAddConnection}
        <svg transition:slide xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      {:else}
        <svg transition:slide xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      {/if}
    </button>
  </div>
  {#if showAddConnection}
  <div transition:slide class="connections__add">
    <div class="field">
      <label for="serverUrl">Server URL</label>
      <input id="serverUrl" name="serverUrl" placeholder="tcp://mqtt.example.com:1883" type="text" bind:value={ serverUrl }/>
    </div>
    <div class="field">
      <label for="username">Username</label>
      <input id="username" name="username" type="text" placeholder="Username" bind:value={ username }/>
    </div>
    <div class="field">
      <label for="password">Password</label>
      <input id="password" name="password" placeholder="Password" type="password" bind:value={ password }/>
    </div>
    <button class="button--primary" on:click={ addConnection }>Add Connection</button>
  </div>
  {/if}
</div>

<style lang="scss">
.connections {
  display:flex;
  flex-direction: column;
  background-color: var(--white);
  box-shadow: var(--shadow-md);
  border-radius: var(--rounded-md);
  padding: calc(var(--spacing-unit) * 3);
  &__add {
    margin-top: calc(var(--spacing-unit)*3);
    display:flex;
    flex-direction: column;
    & > .field:first-child {
      margin-top: 0px;
    }
    & > .field {
      display: flex;
      flex-direction: column;
      margin-top: var(--spacing-unit);
    }
    & > button {
      margin-top: var(--spacing-unit);
    }
  }
  &__configurator {
    position: relative;
    & > button {
      & > svg {
        height: 24px;
        width: 24px;
        position:absolute;
        margin:auto;
        color: var(--teal-600);
      }
      height: 24px;
      width: 24px;
      padding: calc(var(--spacing-unit) * 3);
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: var(--transparent);
      position: absolute;
      right: 0px;
      bottom: 0px;
    }
  }
  &__list {
    & > *:first-child {
      margin-top: 0;
    }
    & > * {
      margin-top: calc(var(--spacing-unit));
    }
  }
  &__connection {
    display:flex;
    align-items: center;
    > *:first-child {
      margin-left: 0;
    }
    > * {
      margin-left: var(--spacing-unit);
    }
  }
  & > h2 {
    font-size: var(--text-sm);
    line-height: var(--text-sm-lh);
    margin-bottom: calc(var(--spacing-unit)*3);
  }
}
[type=text],[type="password"] {
  border-radius: var(--rounded-md)!important;
  border: solid 1px var(--gray-400);
}
button {
  cursor: pointer;
  border: none;
  color: white;
  border-radius: var(--rounded-md);
  padding: calc(var(--spacing-unit) * 1);
}
.button--primary {
  background-color: var(--teal-600);
}
.button--primary:hover {
  background-color: var(--teal-700);
}
.button--icon {
  color: var(--teal-600);
  background-color: transparent;
  display:flex;
  justify-content: center;
  align-items: center;
  border-radius: var(--rounded-full);
  width: 30px;
  height: 30px;
  & > svg {
    flex-grow: 1;
    flex-shrink: 1;
    height: 60px;
    width: 60px;
  }
  transition: transform .3s ease-out;
}
.button--icon:hover {
  transform: scale(1.25);
}
[type=radio] {
  cursor: pointer;
  color: var(--teal-600);
  border: solid 1px var(--gray-300);
  border-radius: var(--rounded-full);
}
[type=radio]:checked {
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='8' cy='8' r='3'/%3e%3c/svg%3e");
}
</style>