<script lang="ts">
  import { fade } from "svelte/transition"
  import Metric from "./Metric.svelte"
  import { onMount } from "svelte"

  export let group
  export let node
  export let device
  export let unborn = false
  export let showDcmdModal = false
  let currentCommand

  $: metrics = {
    commands: device.metrics.filter((metric) => {
      return metric.id.includes('Device Control')
    }),
    data: device.metrics.filter((metric) => {
      return !metric.id.includes('Device Control')
    })
  }
  function showModal(command:any) {
    currentCommand = command
    if (command.type === 'Boolean') {
      sendDcmd(true)
    } else {
      showDcmdModal = true
    } 
  }
  function hideModal() {
    showDcmdModal = false
  }
  function sendDcmd(value:any) {
    console.log(group)
    //@ts-ignore
    window.api.sendDeviceCommand(group.id, node.id, device.id, currentCommand.id, value)
  }
  function handleSubmit(e) {
    const formData = new FormData(e.target)
    const params = {}
    //set boolean values to false as default
    JSON.parse(currentCommand.value).forEach((param) => {
      if( param.type === 'Boolean' ) {
        params[param.name] = false
      }
    })
    //set values to form data
    for (var [key, value] of formData.entries()) { 
      JSON.parse(currentCommand.value).forEach((param) => {
        const name = key.replace('dcmd-','')
        if (param.name === name) {
          if (param.type === `Boolean`) {
            params[name] = value === 'on'
          } else {
            params[name] = value
          }
        }
      })
    }
    sendDcmd(params)
  }
  onMount(() => {
    console.log(device)
  })
</script>

<div class="device">
  <div class="device__header__bar">
    <h4 class="device__header">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>nas</title><path d="M4,5C2.89,5 2,5.89 2,7V17C2,18.11 2.89,19 4,19H20C21.11,19 22,18.11 22,17V7C22,5.89 21.11,5 20,5H4M4.5,7A1,1 0 0,1 5.5,8A1,1 0 0,1 4.5,9A1,1 0 0,1 3.5,8A1,1 0 0,1 4.5,7M7,7H20V17H7V7M8,8V16H11V8H8M12,8V16H15V8H12M16,8V16H19V8H16M9,9H10V10H9V9M13,9H14V10H13V9M17,9H18V10H17V9Z" /></svg>
      {device.id}
    </h4>
    {#if unborn}<span class="device__unborn">Unborn</span>{/if}
  </div>
  <div class="device__commands">
    {#each metrics.commands as metric}
      <button class="button--primary" on:click={ () => { showModal(metric) } }>{ metric.id.replace('Device Control/','') }</button>
    {/each}
  </div>
  <div class="device__metrics">
    {#each metrics.data as metric}
      <div>
        <Metric { metric } />
      </div>
    {/each}
  </div>
</div>
{#if showDcmdModal}
<div transition:fade={{ duration:100 }} class="dcmd-modal">
  <form id="dcmd-form" on:submit|preventDefault={ handleSubmit }>
    <h4>{ currentCommand.id.replace('Device Control/','') }</h4>
    {#each JSON.parse(currentCommand.value) as argument}
      {#if argument.type === 'Boolean'}
        <label class="toggle" for={ `dcmd-${argument.name}` }>
          <div class="switch">
            <input id={ `dcmd-${argument.name}` } name={ `dcmd-${argument.name}` } type="checkbox"/>
            <span class="slider round"></span>
          </div>
          <span>{ argument.name }</span>
        </label>
      {:else }
        <div class="field">
          <label for={ `dcmd-${argument.name}` }>{ argument.name }</label>
          <input id={ `dcmd-${argument.name}` } name={ `dcmd-${argument.name}` } type="text"/>
        </div>
      {/if}
    {/each}
    <button class="button--primary" type="submit">Run Command</button>
    <button class="button--secondary" on:click={ hideModal }>Cancel</button>
  </form>
</div>
{/if}

<style lang="scss">
  .dcmd-modal {
    display:flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
    z-index: 10;
    & > form {
      background-color: var(--white);
      border-radius: var(--rounded-md);
      padding: calc(var(--spacing-unit)*3);
      display: flex;
      flex-direction: column;
      & > * {
        margin-bottom: calc(var(--spacing-unit)*2);
      }
      & > *:last-child {
        margin-bottom: 0px;
      }
      & > .field {
        display:flex;
        flex-direction: column;
      }
    }
  }
  .device {
    background-color: var(--white);
    margin-left: calc(var(--spacing-unit)*3); 
    margin-right: calc(var(--spacing-unit)*3); 
    margin-bottom: calc(var(--spacing-unit)*3); 
    margin-top: calc(var(--spacing-unit)*3);
    border-radius: var(--rounded-md);
    border: solid 1px var(--gray-300);
    &__commands {
      background-color: var(--gray-300);
      display: flex;
      justify-content: right;
      & > button {
        margin: calc(var(--spacing-unit)*0.5);
      }
    }
    &__unborn {
      color: var(--orange-500);
    }
    &__header {
      display: flex;
      align-items: center;
      & > svg {
        height: 24px;
        width: 24px;
        margin-right: calc(var(--spacing-unit));
      }
      &__bar {
        display: flex;
        justify-content: space-between;
        background-color: var(--gray-300);
      }
      padding-left: calc(var(--spacing-unit));
      padding-right: calc(var(--spacing-unit)*3);
      border-top-right-radius: var(--rounded-full);
      border-bottom-right-radius: var(--rounded-full);
      font-size: var(--text-sm);
      line-height: var(--text-sm-lh);
      margin-bottom: 0px; 
    }
    &__metrics {
      & > * {
        background-color: var(--transparent);
        padding: var(--spacing-unit);
      }
      & > *:nth-child(even){
        background-color: var(--gray-200);
      }
    }
  }
</style>