<script lang="ts">
  import gsap from 'gsap'
	import { onMount } from 'svelte';
  
  interface EdgeNodes { nodes: { devices:{ metrics: { name:string, value: number | string }[] }[] }[] }

  export let edgeNodes:EdgeNodes
  let pump1RotorCenter:{ x: null, y: null }
  let valve1IndicatorCenter:{ x: null, y: null }
  let valve1On = false
  let valve1Auto = false
  let animated = {
    tankLiquidOffset: 0.5
  }
  let enableAnimations = false

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

  $: valve1On = getBooleanMetric(edgeNodes, 'Valve1/Open', false)
  $: valve1Auto = getBooleanMetric(edgeNodes, 'Valve1/Auto', false)
  $: pump1On = getBooleanMetric(edgeNodes,'Motor1/On', false)
  $: pump1Auto = getBooleanMetric(edgeNodes,'Motor1/Auto', false)
  $: tankLevel = getAnalogMetric(edgeNodes,'Level', 0)
  $: getTankLiquidOffset(enableAnimations, tankLevel)
  $: console.log(animated.tankLiquidOffset)

  function getMiddle(id:string) {
    const el:any = document.getElementById(id)
    const bbox = el.getBBox()
    return {
      x: bbox.x + bbox.width / 2,
      y: bbox.y + bbox.height / 2,
    }
  }

  function getTankLiquidOffset(enable:boolean, level:number) {
    if (enable) {
      gsap.to('#tank-liquid-top', { attr: { offset: level / 100 } })
      gsap.to('#tank-inside-bottom', { attr: { offset: level / 100 } })
    }
  }

  onMount(() => {
    pump1RotorCenter = getMiddle('pump1Rotor')
    valve1IndicatorCenter = getMiddle('valve1Indicator')
    enableAnimations = true
  })
</script>

<svg
  id="svg4243"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  version="1.1"
  viewBox="0 0 1322.917 482.865"
  style="height: 100%; width: 100%"
>
  <defs id="defs4237">
    <linearGradient id="linearGradient1163">
      <stop
        id="stop1159"
        class="tank-liquid-bottom"
        offset="0"
        stop-opacity="1"
      />
      <stop
        id="tank-liquid-top"
        class="tank-liquid-top"
        offset="0"
        stop-opacity="1"
      />
      <stop
        id="tank-inside-bottom"
        class="tank-inside-bottom"
        offset="0"
        stop-opacity="1"
      />
      <!-- <stop
        id="stop1172"
        class="tank-liquid-top"
        offset={ animated.tankLiquidOffset }
        stop-opacity="1"
      />
      <stop
        id="stop1174"
        class="tank-inside-bottom"
        offset= {animated.tankLiquidOffset }
        stop-opacity="1"
      /> -->
      <stop
        id="stop1161"
        class="tank-inside-top"
        offset="1"
        stop-opacity="1"
      />
    </linearGradient>
    <linearGradient
      id="p"
      gradientUnits="userSpaceOnUse"
      y2="43.9"
      x2="80.288"
      y1="93.526"
      x1="122.033"
      xlink:href="#a"
      gradientTransform="matrix(.255 0 0 .25917 16.075 20.19)"
    />
    <linearGradient id="a">
      <stop id="stop1681" offset="0" stop-color="gray" />
      <stop id="stop1683" offset="1" stop-color="#e6e6e6" />
    </linearGradient>
    <linearGradient id="linearGradientTank1Level">
      <stop
        id="stop1Tank1Level"
        offset="0"
        stop-color="blue"
        stop-opacity="1"
      />
      <stop
        id="stop2Tank1Level"
        offset="1"
        stop-color="blue"
        stop-opacity="0"
      />
    </linearGradient>
    <linearGradient
      id="n"
      xlink:href="#f"
      gradientUnits="userSpaceOnUse"
      gradientTransform="matrix(0 .02694 -.39753 0 64.754 42.53)"
      x1="97.67"
      y1="75.256"
      x2="97.67"
      y2="44.988"
    />
    <linearGradient id="f">
      <stop id="stop1667" offset="0" stop-color="#1a1a1a" />
      <stop id="stop1669" offset=".5" stop-color="#999" />
      <stop id="stop1671" offset="1" stop-color="#1a1a1a" />
    </linearGradient>
    <linearGradient
      id="m"
      xlink:href="#b"
      gradientUnits="userSpaceOnUse"
      gradientTransform="matrix(.02651 0 0 .40404 48.98 27.744)"
      x1="97.67"
      y1="75.256"
      x2="97.67"
      y2="44.988"
    />
    <linearGradient id="b">
      <stop id="stop1695" offset="0" stop-color="#333" />
      <stop id="stop1697" offset=".439" stop-color="#ccc" />
      <stop id="stop1699" offset="1" stop-color="#666" />
    </linearGradient>
    <linearGradient
      id="l"
      y2="44.988"
      x2="97.67"
      y1="75.256"
      x1="97.67"
      gradientTransform="matrix(.02651 0 0 .40404 27.76 27.744)"
      gradientUnits="userSpaceOnUse"
      xlink:href="#b"
    />
    <linearGradient
      id="i"
      xlink:href="#c"
      gradientUnits="userSpaceOnUse"
      gradientTransform="matrix(.04664 0 0 .20383 29.097 31.796)"
      x1="96.969"
      y1="126.041"
      x2="96.969"
      y2="72.168"
    />
    <linearGradient id="c">
      <stop id="stop1687" offset="0" stop-color="#999" />
      <stop id="stop1689" offset=".494" stop-color="#f9f9f9" />
      <stop id="stop1691" offset="1" stop-color="#999" />
    </linearGradient>
    <linearGradient
      id="linearGradient4847"
      xlink:href="#c"
      gradientUnits="userSpaceOnUse"
      gradientTransform="matrix(.17629 0 0 .77037 44.802 41.842)"
      x1="96.969"
      y1="126.041"
      x2="96.969"
      y2="72.168"
    />
    <linearGradient
      id="h"
      xlink:href="#e"
      gradientUnits="userSpaceOnUse"
      gradientTransform="matrix(0 .04698 -.18552 0 59.28 44.704)"
      x1="96.969"
      y1="126.041"
      x2="96.969"
      y2="72.168"
    />
    <linearGradient id="e">
      <stop id="stop1660" offset="0" stop-color="#4d4d4d" />
      <stop id="stop1662" offset=".494" stop-color="#ccc" />
      <stop id="stop1664" offset="1" stop-color="#4d4d4d" />
    </linearGradient>
    <linearGradient
      id="g"
      xlink:href="#d"
      gradientUnits="userSpaceOnUse"
      gradientTransform="matrix(.0662 0 0 .18856 33.93 32.898)"
      x1="96.969"
      y1="126.041"
      x2="96.969"
      y2="72.168"
    />
    <linearGradient id="d">
      <stop id="stop1674" offset="0" stop-color="gray" />
      <stop id="stop1676" offset=".494" stop-color="#f9f9f9" />
      <stop id="stop1678" offset="1" stop-color="#999" />
    </linearGradient>
    <linearGradient
      id="p-0"
      gradientUnits="userSpaceOnUse"
      y2="43.9"
      x2="80.288"
      y1="93.526"
      x1="122.033"
      xlink:href="#a"
      gradientTransform="matrix(.255 0 0 .25917 141.106 96.184)"
    />
    <linearGradient
      id="n-9"
      xlink:href="#f"
      gradientUnits="userSpaceOnUse"
      gradientTransform="matrix(0 .02694 -.39753 0 189.784 118.525)"
      x1="97.67"
      y1="75.256"
      x2="97.67"
      y2="44.988"
    />
    <linearGradient
      id="m-5"
      xlink:href="#b"
      gradientUnits="userSpaceOnUse"
      gradientTransform="matrix(.02651 0 0 .40404 174.011 103.738)"
      x1="97.67"
      y1="75.256"
      x2="97.67"
      y2="44.988"
    />
    <linearGradient
      id="l-5"
      y2="44.988"
      x2="97.67"
      y1="75.256"
      x1="97.67"
      gradientTransform="matrix(.02651 0 0 .40404 152.79 103.738)"
      gradientUnits="userSpaceOnUse"
      xlink:href="#b"
    />
    <linearGradient
      id="i-4"
      xlink:href="#c"
      gradientUnits="userSpaceOnUse"
      gradientTransform="matrix(.04664 0 0 .20383 154.128 107.79)"
      x1="96.969"
      y1="126.041"
      x2="96.969"
      y2="72.168"
    />
    <linearGradient
      id="h-3"
      xlink:href="#e"
      gradientUnits="userSpaceOnUse"
      gradientTransform="matrix(0 .04698 -.18552 0 184.31 120.698)"
      x1="96.969"
      y1="126.041"
      x2="96.969"
      y2="72.168"
    />
    <linearGradient
      id="g-4"
      xlink:href="#d"
      gradientUnits="userSpaceOnUse"
      gradientTransform="matrix(.0662 0 0 .18856 158.96 108.892)"
      x1="96.969"
      y1="126.041"
      x2="96.969"
      y2="72.168"
    />
    <linearGradient id="linearGradient881">
      <stop id="stop877" offset="0" stop-color="#e6e6e6" stop-opacity="1" />
      <stop id="stop879" offset="1" stop-color="#999" stop-opacity="1" />
    </linearGradient>
    <linearGradient id="linearGradient869">
      <stop id="stop865" offset="0" stop-color="#f9f9f9" stop-opacity="1" />
      <stop id="stop867" offset="1" stop-color="#ccc" stop-opacity="1" />
    </linearGradient>
    <linearGradient
      id="linearGradient859"
      gradientTransform="matrix(.95505 0 0 .9637 -78.55 -19.27)"
      gradientUnits="userSpaceOnUse"
      y2="131.827"
      x2="197.591"
      y1="131.827"
      x1="16.958"
      xlink:href="#linearGradient857"
    />
    <linearGradient id="linearGradient857">
      <stop id="stop853" offset="0" stop-color="#999" stop-opacity="1" />
      <stop
        id="stop861"
        offset=".498"
        stop-color="#f2f2f2"
        stop-opacity="1"
      />
      <stop id="stop855" offset="1" stop-color="#999" stop-opacity="1" />
    </linearGradient>
    <linearGradient
      id="linearGradient930"
      xlink:href="#linearGradient928"
      x1="97.67"
      y1="75.256"
      x2="97.67"
      y2="44.988"
      gradientUnits="userSpaceOnUse"
      gradientTransform="matrix(1 0 0 1.22086 -.101 -10.297)"
    />
    <linearGradient id="linearGradient928">
      <stop id="stop924" offset="0" stop-color="#666" stop-opacity="1" />
      <stop
        id="stop932"
        offset=".439"
        stop-color="#f2f2f2"
        stop-opacity="1"
      />
      <stop id="stop926" offset="1" stop-color="#999" stop-opacity="1" />
    </linearGradient>
    <linearGradient id="linearGradient857-4">
      <stop id="stop853-1" offset="0" stop-color="#e6e6e6" stop-opacity="1" />
      <stop
        id="stop918"
        offset=".141"
        stop-color="#b3b3b3"
        stop-opacity="1"
      />
      <stop
        id="stop916"
        offset=".169"
        stop-color="#8c8c8c"
        stop-opacity="1"
      />
      <stop id="stop914" offset=".519" stop-color="#666" stop-opacity="1" />
      <stop
        id="stop865-8"
        offset=".539"
        stop-color="#b3b3b3"
        stop-opacity="1"
      />
      <stop
        id="stop863"
        offset=".787"
        stop-color="#f9f9f9"
        stop-opacity="1"
      />
      <stop id="stop855-5" offset="1" stop-color="#999" stop-opacity="1" />
    </linearGradient>
    <linearGradient
      id="linearGradient936"
      xlink:href="#linearGradient944"
      gradientUnits="userSpaceOnUse"
      gradientTransform="matrix(.10396 0 0 1.31908 113.85 -16.187)"
      x1="97.67"
      y1="75.256"
      x2="97.67"
      y2="44.988"
    />
    <linearGradient id="linearGradient944">
      <stop id="stop938" offset="0" stop-color="#333" stop-opacity="1" />
      <stop id="stop940" offset=".439" stop-color="#ccc" stop-opacity="1" />
      <stop id="stop942" offset="1" stop-color="#666" stop-opacity="1" />
    </linearGradient>
    <linearGradient
      id="linearGradient841"
      gradientTransform="matrix(3.35657 0 0 .61179 -324.994 43.162)"
      gradientUnits="userSpaceOnUse"
      y2="72.168"
      x2="96.969"
      y1="126.041"
      x1="96.969"
      xlink:href="#linearGradient839"
    />
    <linearGradient id="linearGradient839">
      <stop id="stop835" offset="0" stop-color="#999" stop-opacity="1" />
      <stop
        id="stop843"
        offset=".494"
        stop-color="#f9f9f9"
        stop-opacity="1"
      />
      <stop id="stop837" offset="1" stop-color="#999" stop-opacity="1" />
    </linearGradient>
    <linearGradient
      id="linearGradient5317"
      y2="72.168"
      x2="96.969"
      y1="126.041"
      x1="96.969"
      gradientTransform="matrix(3.35657 0 0 .61179 -324.994 43.162)"
      gradientUnits="userSpaceOnUse"
      xlink:href="#linearGradient839"
    />
    <linearGradient
      id="linearGradient5325"
      y2="72.168"
      x2="96.969"
      y1="126.041"
      x1="96.969"
      gradientTransform="matrix(3.35657 0 0 .61179 -324.994 43.162)"
      gradientUnits="userSpaceOnUse"
      xlink:href="#linearGradient839"
    />
    <linearGradient
      id="linearGradient5333"
      y2="72.168"
      x2="96.969"
      y1="126.041"
      x1="96.969"
      gradientTransform="matrix(3.35657 0 0 .61179 -324.994 43.162)"
      gradientUnits="userSpaceOnUse"
      xlink:href="#linearGradient839"
    />
    <linearGradient
      id="linearGradient1165"
      gradientUnits="userSpaceOnUse"
      y2="36.834"
      x2="30"
      y1="179.205"
      x1="30"
      xlink:href="#linearGradient1163"
    />
    <filter
      id="o"
      height="1.117"
      y="-.059"
      width="1.084"
      x="-.042"
      color-interpolation-filters="sRGB"
    >
      <feGaussianBlur id="feGaussianBlur1710" stdDeviation="1.191" />
    </filter>
    <filter
      id="k"
      height="1.218"
      y="-.109"
      width="1.218"
      x="-.109"
      color-interpolation-filters="sRGB"
    >
      <feGaussianBlur id="feGaussianBlur1707" stdDeviation="1.615" />
    </filter>
    <filter
      id="o-5"
      height="1.117"
      y="-.059"
      width="1.084"
      x="-.042"
      color-interpolation-filters="sRGB"
    >
      <feGaussianBlur id="feGaussianBlur1710-0" stdDeviation="1.191" />
    </filter>
    <filter
      id="k-9"
      height="1.218"
      y="-.109"
      width="1.218"
      x="-.109"
      color-interpolation-filters="sRGB"
    >
      <feGaussianBlur id="feGaussianBlur1707-8" stdDeviation="1.615" />
    </filter>
    <radialGradient
      id="radialGradient875"
      r="50"
      fy="-32.509"
      fx="108.503"
      cy="-32.509"
      cx="108.503"
      gradientTransform="matrix(1.6866 0 .00021 .4341 -157.576 -180.228)"
      gradientUnits="userSpaceOnUse"
      xlink:href="#linearGradient881"
    />
    <radialGradient
      id="radialGradient871"
      gradientUnits="userSpaceOnUse"
      gradientTransform="matrix(-3.57656 .00507 -.00095 -.40437 413.42 7.445)"
      r="50"
      fy="19.014"
      fx="108.489"
      cy="19.014"
      cx="108.489"
      xlink:href="#linearGradient869"
    />
    <radialGradient
      id="radialGradient859"
      xlink:href="#linearGradient857-4"
      cx="74.417"
      cy="91.298"
      fx="74.417"
      fy="91.298"
      r="47.027"
      gradientUnits="userSpaceOnUse"
    />
  </defs>
  <g id="layer1" transform="translate(249.075 .1)">
    <g
      id="g1018"
      transform="matrix(1.32334 0 0 1.32292 80.322 .032)"
      stroke-width=".756"
    >
      <g
        id="g1016"
        transform="matrix(1.698 0 0 1.6923 173.394 .07)"
        stroke-width=".446"
      >
        <g
          id="pipe2"
          transform="matrix(.25435 0 0 .9336 -107.86 -6.563)"
          stroke-width=".484"
          fill-opacity="1"
          stroke="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            id="rect5327"
            opacity="1"
            fill="url(#linearGradient5333)"
            d="M-246.452 87.324H328.54v32.811h-574.992z"
          />
          <path
            id="rect5329"
            opacity="0"
            fill="teal"
            d="M-246.452 87.324H328.54v32.811h-574.992z"
          />
        </g>
        <g
          id="pipe1"
          transform="matrix(.12192 0 0 .9336 -214.775 -6.563)"
          stroke-width=".699"
          fill-opacity="1"
          stroke="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            id="rect5319"
            opacity="1"
            fill="url(#linearGradient5325)"
            d="M-246.452 87.324H328.54v32.811h-574.992z"
          />
          <path
            id="rect5321"
            opacity="0"
            fill="teal"
            d="M-246.452 87.324H328.54v32.811h-574.992z"
          />
        </g>
        <g
          id="pipe4"
          transform="matrix(.16355 0 0 1 254.845 36.82)"
          stroke-width=".583"
          fill-opacity="1"
          stroke="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            id="rect5311"
            opacity="1"
            fill="url(#linearGradient5317)"
            d="M-246.452 87.324H328.54v32.811h-574.992z"
          />
          <path
            id="rect5313"
            opacity="0"
            fill="teal"
            d="M-246.452 87.324H328.54v32.811h-574.992z"
          />
        </g>
        <g
          id="pipe3"
          transform="matrix(.2947 0 0 1 103.311 61.69)"
          stroke-width=".435"
          fill-opacity="1"
          stroke="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            id="rect833"
            opacity="1"
            fill="url(#linearGradient841)"
            d="M-246.452 87.324H328.54v32.811h-574.992z"
          />
          <path
            id="rect845"
            opacity="0"
            fill="teal"
            d="M-246.452 87.324H328.54v32.811h-574.992z"
          />
        </g>
        <g
          id="valve1"
          transform="matrix(3.2818 0 0 3.2818 -283.058 -80.218)"
          stroke-width=".136"
        >
          <path
            id="path1715"
            d="M35.478 46.509h11.34v10.113h-11.34z"
            fill="url(#g)"
            stroke-width=".036"
          />
          <path
            id="path1717"
            d="M45.888 45.803v8.047h-9.95v-8.047z"
            fill="url(#h)"
            stroke-width=".036"
          />
          <path
            id="j"
            stroke-linejoin="round"
            stroke-linecap="round"
            stroke-width=".019"
            stroke="none"
            fill-opacity="1"
            fill="url(#i)"
            d="M30.889 46.509h4.393a2.832 2.832 0 011.32.326l3.417 1.8a1.165 1.165 0 01.622 1.026l.02 4.864a1.15 1.15 0 01-.619 1.025l-2.997 1.566a2.85 2.85 0 01-1.32.325h-4.836a.7.7 0 01-.7-.7v-9.532a.7.7 0 01.7-.7z"
          />
          <use
            id="use1720"
            stroke-width=".136"
            height="100%"
            width="100%"
            transform="matrix(-1 0 0 1 81.87 0)"
            xlink:href="#j"
            x="0"
            y="0"
          />
          <circle
            id="circle1722"
            filter="url(#k)"
            fill="#666"
            r="17.806"
            cy="69.297"
            cx="97.345"
            transform="matrix(.21633 0 0 .22403 19.855 36.38)"
            stroke-width=".044"
          />
          <ellipse
            id="ellipse1724"
            fill="#f2f2f2"
            ry="4.105"
            rx="4.037"
            cx="40.913"
            cy="51.423"
            stroke-width=".036"
          />
          <path
            id="path1728"
            d="M29.731 45.78H31v12.39h-1.268z"
            fill="url(#l)"
            stroke-width=".036"
          />
          <path
            id="path1730"
            d="M50.953 45.78h1.268v12.39h-1.268z"
            fill="url(#m)"
            stroke-width=".036"
          />
          <path
            id="path1732"
            d="M47.008 44.534v1.29h-12.19v-1.29z"
            fill="url(#n)"
            stroke-width=".036"
          />
          <rect
            id="rect1734"
            filter="url(#o)"
            fill-opacity=".5"
            ry=".23"
            y="43.523"
            x="55.287"
            height="48.739"
            width="68.349"
            transform="matrix(.1645 0 0 .27266 26.204 20.379)"
            rx=".229"
            stroke-width=".044"
          />
          <rect
            id="rect1736"
            rx=".061"
            fill="url(#p)"
            width="18.084"
            height="12.896"
            x="31.871"
            y="31.589"
            ry=".061"
            stroke-width=".036"
          />
          <rect
            id="rect1736"
            class={ valve1On ? 'status-color-on' : 'status-color-off' }
            rx=".061"
            opacity="0.25"
            width="18.084"
            height="12.896"
            x="31.871"
            y="31.589"
            ry=".061"
            stroke-width=".036"
          />
          <path
            id="valve1Indicator"
            class={ valve1On ? 'valve-indicator-on' : 'valve-indicator-off' }
            style={ valve1IndicatorCenter ? `transform-origin: ${valve1IndicatorCenter.x}px ${valve1IndicatorCenter.y}px` : null }
            d="M39.552 50.179l-1.308.614-1.34.63 1.34.63 1.308.614 1.362.404 1.36-.404 1.309-.615 1.34-.63-1.34-.629-1.309-.614-1.36-.405z"
            fill="#1a1a1a"
            fill-opacity="1"
            stroke="#000"
            stroke-width=".036"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="4"
            stroke-dasharray="none"
          />
        </g>
        <g
          id="pump1"
          transform="translate(120.238 77.258)"
          stroke-width=".446"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-opacity=".96"
        >
          <path
            id="rect934"
            fill="url(#linearGradient936)"
            fill-opacity="1"
            stroke="none"
            stroke-width=".446"
            stroke-miterlimit="4"
            stroke-dasharray="none"
            d="M121.582 42.696h4.973v40.449h-4.973z"
          />
          <path
            id="rect922"
            fill="url(#linearGradient930)"
            fill-opacity="1"
            stroke="none"
            stroke-width=".446"
            stroke-miterlimit="4"
            stroke-dasharray="none"
            d="M74.275 44.202h47.836v37.437H74.275z"
          />
          <circle
            id="path851"
            r="47.027"
            cy="91.298"
            cx="74.417"
            fill="url(#radialGradient859)"
            fill-opacity="1"
            stroke="none"
            stroke-width="2.229"
          />
          <path
            id="pump1Rotor"
            style={ pump1RotorCenter ? `transform-origin: ${pump1RotorCenter.x}px ${pump1RotorCenter.y}px` : null }
            class={ pump1On ? 'pump-rotor-on' : 'pump-rotor-off' }
            d="M64.052 79.172c-2.045-2.486-3.387-5.053-3.013-7.225.212-1.236 2.046-2.241 2.079-1.202.08 2.51-.26 4.892 1.516 7.938 1.475 2.528 3.806 5.058 4.784 6.035-.755-.703-3.743-3.572-5.366-5.546zm9.028-3.388c-.158-3.178.315-6.052 1.835-7.61.85-.872 2.934-.721 2.367.186-1.322 2.115-3.01 3.945-3.381 7.402-.325 3.011.078 6.21.453 7.745-.417-1.424-1.13-4.843-1.274-7.723zm9.777 2.231c1.6-2.726 3.548-4.864 5.68-5.293 1.173-.236 2.878 1.08 1.868 1.501-2.318.968-4.669 1.52-6.876 4.201-1.893 2.302-3.333 5.213-3.927 6.606.474-1.237 1.862-4.64 3.255-7.015zm6.137 7.167c2.96-1.122 5.805-1.558 7.746-.566 1.087.555 1.558 2.591.529 2.315-2.419-.65-4.619-1.705-8.014-1.004-2.902.599-5.885 1.966-7.21 2.715 1.157-.717 4.37-2.483 6.949-3.46zm.641 9.989c3.106.697 5.754 1.924 6.838 3.801.607 1.052-.112 3.018-.825 2.226-1.66-1.842-2.966-3.946-6.202-5.23-2.823-1.12-5.997-1.58-7.555-1.638 1.458-.01 4.922.207 7.744.84zm-4.764 8.427c1.046 1.196 1.93 2.415 2.52 3.657.586 1.232.847 2.423.698 3.468-.17 1.183-1.989 2.295-2.05 1.262-.149-2.509.12-4.9-1.753-7.9-1.553-2.486-3.973-4.961-4.965-5.902.467.413 1.458 1.325 2.25 2.069 1 .947 2.234 2.127 3.3 3.346zm-8.912 3.61c.235 3.172-.169 6.054-1.651 7.649-.83.892-2.916.792-2.37-.129 1.27-2.147 2.913-4.014 3.202-7.478.252-3.015-.227-6.206-.636-7.731.447 1.412 1.242 4.82 1.455 7.69zm-9.843-2.003c-1.528 2.77-3.422 4.958-5.538 5.445-1.168.269-2.897-.998-1.905-1.447 2.283-1.032 4.622-1.65 6.757-4.39 1.836-2.355 3.192-5.297 3.741-6.71-.437 1.266-1.716 4.675-3.055 7.102zm-6.348-6.985c-2.929 1.202-5.759 1.715-7.725.772-1.101-.527-1.622-2.552-.587-2.301 2.434.59 4.655 1.587 8.03.795 2.88-.675 5.834-2.124 7.134-2.898-1.125.732-4.314 2.591-6.852 3.632zm-.879-9.949c-3.123-.623-5.8-1.787-6.93-3.637-.633-1.037.036-3.02.769-2.246 1.707 1.8 3.066 3.875 6.332 5.08 2.85 1.053 6.036 1.436 7.598 1.454-1.463.05-4.928-.083-7.769-.65z"
            fill="#000"
            fill-opacity=".8"
            stroke="#4d4d4d"
            stroke-width=".446"
            stroke-miterlimit="4"
            stroke-dasharray="none"
          />
          <path
            id="pump1Color"
            class={ pump1On ? 'status-color-on' : 'status-color-off' }
            d="M121.582 42.696v1.507H74.275v.069A47.027 47.027 0 0027.39 91.298a47.027 47.027 0 0047.026 47.026 47.027 47.027 0 0047.027-47.026 47.027 47.027 0 00-1.002-9.658h1.141v1.506h4.973v-40.45z"
            stroke="none"
            stroke-width=".446"
            stroke-miterlimit="4"
            stroke-dasharray="none"
          />
        </g>
        <g
          id="tank1"
          stroke-width=".446"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            id="rect851"
            fill="url(#linearGradient859)"
            fill-opacity="1"
            stroke-width=".236"
            d="M-62.354 20.734h172.513v174.074H-62.354z"
          />
          <path
            id="path863"
            d="M-62.355 21.063A86.257 21.164 0 0123.902-.101a86.257 21.164 0 0186.257 21.164"
            fill="url(#radialGradient871)"
            fill-opacity="1"
            stroke-width=".236"
          />
          <path
            id="path873"
            d="M-62.322-194.419a86.257 21.164 0 0186.257-21.163 86.257 21.164 0 0186.257 21.163"
            transform="scale(1 -1)"
            fill="url(#radialGradient875)"
            fill-opacity="1"
            stroke-width=".236"
          />
          <rect
            id="tank1Cutout"
            width="142.979"
            height="142.979"
            x="-47.571"
            y="36.251"
            ry="3.495"
            rx="3.482"
            fill="url(#linearGradient1165)"
            stroke="#666"
            stroke-width=".59"
          />
        </g>
        <path
          id="outlet1"
          transform="matrix(.41262 0 0 .41394 149.272 74.107)"
          d="M461.589 160.51l-38.801 22.402-38.801 22.402v-89.607l38.8 22.401z"
          fill="grey"
          stroke="grey"
          stroke-width="1.427"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          id="inlet1"
          d="M461.589 160.51l-38.801 22.402-38.801 22.402v-89.607l38.8 22.401z"
          transform="matrix(.41262 0 0 .41394 -406.855 23.837)"
          fill="grey"
          stroke="grey"
          stroke-width="1.427"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <rect
          id="pump1StatusRect"
          class={ pump1Auto ? 'status-mode-auto' : 'status-mode-manual' }
          rx=".58"
          ry=".582"
          y="91.403"
          x="172.444"
          height="22.158"
          width="49.534"
          stroke-width=".59"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <text
          id="text5370"
          y="105"
          x="197"
          style="
            line-height: 1.25;
            font-variant-ligatures: normal;
            font-variant-caps: normal;
            font-variant-numeric: normal;
            font-variant-east-asian: normal;
          "
          xml:space="preserve"
          font-style="normal"
          font-variant="normal"
          font-weight="400"
          font-stretch="normal"
          font-size="14.091"
          font-family="Oswald"
          letter-spacing="0"
          word-spacing="0"
          stroke-width=".118"
          dominant-baseline="middle"
          text-anchor="middle"
          fill="black"
        >
          { pump1Auto ? 'AUTO' : 'MANUAL' }
        </text>
        <rect
          id="pump1StatusRect"
          class={pump1Auto ? 'status-mode-auto' : 'status-mode-manual'}
          rx=".58"
          ry=".582"
          x="-173.223"
          y="116.871"
          height="22.158"
          width="49.534"
          stroke-width=".59"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <text
          id="text5370"
          x="-148.551"
          y="130.5"
          style="
            line-height: 1.25;
            font-variant-ligatures: normal;
            font-variant-caps: normal;
            font-variant-numeric: normal;
            font-variant-east-asian: normal;
          "
          xml:space="preserve"
          font-style="normal"
          font-variant="normal"
          font-weight="400"
          font-stretch="normal"
          font-size="14.091"
          font-family="Oswald"
          letter-spacing="0"
          word-spacing="0"
          stroke-width=".118"
          dominant-baseline="middle"
          text-anchor="middle"
          fill="black"
        >
          { pump1Auto ? 'AUTO' : 'MANUAL' }
        </text>
      </g>
    </g>
  </g>
</svg>

<style scoped lang="scss">
.pump-rotor-on {
  opacity: 0;
  transform: rotate(270deg);
  transition: all 2s ease-out;
}
.pump-rotor-off {
  opacity: 1;
  transform: rotate(0deg);
  transition:all 2s ease-in;
}
.valve-indicator-on {
  transform: rotate(0deg);
  transition: transform 2s ease-out;
}
.valve-indicator-off {
  transform: rotate(90deg);
  transition: transform 2s ease-in;
}
.status-color-on {
  fill: var(--green-500);
  opacity: 0.4;
  transition: all 0.3s ease-in;
}
.status-color-off {
  fill: transparent;
  transition: all 0.3s ease-in;
}
.status-mode-auto {
  fill: var(--gray-300);
  transition: all 0.3s ease-in;
  stroke: var(--gray-600);
}
.status-mode-manual {
  fill: var(--orange-500);
  transition: all 0.3s ease-in;
  stroke: var(--orange-700);
}
.tank-liquid-bottom {
  stop-color: var(--blue-900);
  transition: all 0.3s ease-in;
}
.tank-liquid-top {
  stop-color:var(--blue-500);
  transition: all 0.3s ease-in;
}
.tank-inside-bottom {
  stop-color: var(--gray-600);
  transition: all 0.3s ease-in;
}
.tank-inside-top {
  stop-color: var(--gray-900);
  transition: all 0.3s ease-in;
}
</style>