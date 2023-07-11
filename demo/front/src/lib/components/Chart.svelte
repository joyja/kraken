<script lang="ts">
  import { Chart, Title, Tooltip, Legend, LineController, LineElement, PointElement, LinearScale, TimeSeriesScale, type ChartItem } from 'chart.js'
	import { onMount } from 'svelte';
  import fromUnixTime from 'date-fns/fromUnixTime'
  import 'chartjs-adapter-date-fns'

  interface EdgeNodes { nodes: { devices:{ metrics: { name:string, value: number | string, history:{ value:number, timestamp:number }[] }[] }[] }[] }
  interface HistoricalRow { y:number, x:Date }

  export let edgeNodes:EdgeNodes
  let chart:Chart<'line', HistoricalRow[] | undefined>
  let mounted = false

  function getHistory(data:EdgeNodes, name:string) {
    return data.nodes[0]?.devices[0]?.metrics?.find(
      (metric) => metric.name === name
    )?.history?.sort((a, b) => {
      return a.timestamp - b.timestamp
    }).map((row) => {
      return {
        y: row.value,
        x: fromUnixTime(row.timestamp),
      }
    })
  }
  
  function getDatasets(tankLevelData?:HistoricalRow[], inletFlowData?:HistoricalRow[], outletFlowData?:HistoricalRow[]) {
    return [
      {
        label: 'Tank 1 Level',
        borderColor: 'darkBlue',
        fill: false,
        data: tankLevelData,
        tension: 0,
      },
      {
        label: 'Inlet Flow',
        borderColor: 'blue',
        fill: false,
        data: inletFlowData,
        tension: 0,
      },
      {
        label: 'Outlet Flow',
        borderColor: 'lightBlue',
        fill: false,
        data: outletFlowData,
        tension: 0,
      },
    ]
  }

  function updateDatasets(datasets:any) {
    if (mounted) {
      chart.data.datasets = datasets
      chart.update()
    }
  }

  $: tankLevelData = getHistory(edgeNodes, 'Level')
  $: inletFlowData = getHistory(edgeNodes, 'inletFlow')
  $: outletFlowData = getHistory(edgeNodes, 'outletFlow')
  $: datasets = getDatasets(tankLevelData, inletFlowData, outletFlowData)
  $: updateDatasets(datasets)

  onMount(() => {
    Chart.register(Title, Tooltip, Legend, LineController, LineElement, LinearScale, PointElement, TimeSeriesScale)

    chart = new Chart(
      (document.getElementById('history') as ChartItem),
      {
        type: 'line',
        data: {
          datasets,
        },
        options: {
          maintainAspectRatio: false,
          animation: false,
          responsive: true,
          scales: {
            x: {
              type: 'timeseries',
              ticks: {
                maxTicksLimit: 10,
                minRotation: 45,
              },
            },
          },
          elements: {
            point: {
              radius: 0,
            },
          },
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      }
    )
    mounted = true
  })
</script>

<div class="chart__wrapper"><canvas id="history"></canvas></div>

<style lang="scss">
    /* On screens that are 600px or less, set the background color to olive */
  @media screen and (max-width: 800px) {
    .chart__wrapper {
      width:calc(100vw - var(--spacing-unit)*3);
    }
  }
  .chart__wrapper {
    flex-grow: 1;
    position: relative; 
  }
</style>