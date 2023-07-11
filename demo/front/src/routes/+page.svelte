<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import Process from '$lib/components/Process.svelte';
	import Gauge from '$lib/components/Gauge.svelte';
	import Chart from '$lib/components/Chart.svelte';

  interface EdgeNodes { nodes: { devices:{ metrics: { name:string, value: number | string }[] }[] }[] }

  export let data:PageData
  $: edgeNodes = data
  let interval:ReturnType<typeof setInterval>
  
  function getBooleanMetric(edgeNodes:EdgeNodes, name:string, defaultValue:boolean) {
    const value = edgeNodes.nodes[0]?.devices[0]?.metrics.find(metric => metric.name === name)?.value
    if (value) {
      return `${value}` === 'true'
    } else {
      return defaultValue
    }
  }
  
  function getAnalogMetric(edgeNodes:EdgeNodes, name:string, defaultValue:number) {
    const value = edgeNodes.nodes[0]?.devices[0]?.metrics.find(metric => metric.name === name)?.value
    if (value) {
      return parseFloat(`${value}`)
    } else {
      return defaultValue
    }
  }
  
  $: inletFlow = getAnalogMetric(edgeNodes, 'inletFlow', 0)
  $: tankLevel = getAnalogMetric(edgeNodes, 'Level', 0)
  $: outletFlow = getAnalogMetric(edgeNodes, 'outletFlow', 0)

  onMount(() => {
    interval = setInterval(() => {
      invalidateAll()
    },2500)
  })
  onDestroy(() => {
    clearInterval(interval)
  })
</script>

<div class="page">
  <div class="wrapper">
    <div class="process">
      <Process { edgeNodes } />
    </div>
    <div class="values">
      <div><p>Inlet Flow</p><Gauge color="black" max={120} value={ inletFlow } width={ 15 } rotate={ 90 }/></div>
      <div><p>Tank Level</p><Gauge color="black" max={100} value={ tankLevel } width={ 15 } rotate={ 90 }/></div>
      <div><p>Outlet Flow</p><Gauge color="black" max={120} value={ outletFlow } width={ 15 } rotate={ 90 }/></div>
    </div>
    <div class="chart"><Chart { edgeNodes }/></div>
  </div>
</div>
<!-- <pre>{ JSON.stringify(data,null,4) }</pre> -->

<style lang="scss">
  .page {
    display: flex;
    justify-content: center;
    & > .wrapper {
      display:flex;
      flex-direction: column;
      margin: calc(var(--spacing-unit)*3);
      flex-basis: 800px;
      max-width: 800px;
      flex-grow: 0;
      flex-shrink: 1;
    }
  }
  .process {
    display: flex;
    justify-content: center;
    flex-grow: 1;
    flex-shrink: 1;
  }
  .values {
    margin: calc(var(--spacing-unit)*5);
    display: flex;
    justify-content: space-between;
    & > div {
      display:flex;
      flex-shrink: 1;
      flex-direction: column;
      font-family: 'Open Sans';
      text-align: center;
      & > p {
        margin-bottom: 0;
      }
    }
  }
  .chart {
    display: flex;
    justify-content: center;
    flex-basis: 100px;
  }
</style>