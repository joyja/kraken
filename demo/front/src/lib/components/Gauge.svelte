<script lang="ts">
	export let eClass='', 
    eStyle= '', 
    rotate = 0, 
    value = 0, 
    size = 100, 
    width = 4, 
    color = 'rgb(0, 170, 136)', 
    units = '',
    min = 0,
    max = 100,
    decimals = 0
  let radius = 20
  const getNormalizedValue = function(value:number) {
    if (value < min) {
      return min
    }
    if (value > max) {
      return max
    }
    return value
  }
  $: normalizedValue = getNormalizedValue(value)
  $: calculatedSize = Number(size)
  $: circumference = 2 * Math.PI * radius
  $: strokeDashArray = Math.round(circumference * 1000) / 1000
  $: strokeDashOffset = ((100 - (100 * normalizedValue / (max - min))) / 100) * circumference + 'px'
  $: strokeWidth = (Number(width) / +size) * viewBoxSize * 2
  $: styles = `height: ${calculatedSize + 'px'}; width: ${calculatedSize + 'px'}`
  $: svgStyles = `transform: rotate(${Number(rotate)}deg)`
  $: viewBoxSize = radius / (1 - Number(width) / +size)
</script>

<div class={`v-progress-circular ${eClass}`} style={`${styles}${eStyle ? '; ' + eStyle : ''}`}>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox={`${viewBoxSize} ${viewBoxSize} ${2 * viewBoxSize} ${2 * viewBoxSize}`} color={color} style={svgStyles}>
    <circle fill="transparent" cx={2 * viewBoxSize} cy={2 * viewBoxSize} r={radius} stroke-width={strokeWidth} stroke-dasharray={strokeDashArray} stroke-dashoffset="0" class="v-progress-circular__underlay"></circle>
    <circle fill="transparent" cx={2 * viewBoxSize} cy={2 * viewBoxSize} r={radius} stroke-width={strokeWidth} stroke-dasharray={strokeDashArray} stroke-dashoffset={strokeDashOffset} class="v-progress-circular__overlay"></circle>
  </svg>
  <div class="v-progress-circular__info">{ normalizedValue.toFixed(decimals) } { units }</div>
</div>
  
<style lang="scss">
.v-progress-circular__overlay {
  stroke: currentColor;
  z-index: 2;
  transition: all 0.6s ease-in-out;
}
.v-progress-circular__underlay {
  stroke: hsla(0, 0%, 62%, 0.4);
  z-index: 1;
}
.v-progress-circular__info {
  align-items: center;
  display: flex;
  justify-content: center;
  font-family: 'Open Sans'
}
.v-progress-circular {
  position: relative;
  display: inline-flex;
  vertical-align: middle;
  justify-content: center;
  align-items: center;
}
.v-progress-circular > svg {
  // width: 100%;
  height: 100%;
  margin: auto;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 0;
}
</style>