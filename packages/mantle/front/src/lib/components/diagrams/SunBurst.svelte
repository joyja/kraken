<script lang="ts">
  import { onMount } from 'svelte'
  import * as d3 from 'd3'

  export let id: string
  export let data: object

  function renderDiagram() {
    // Specify the chart’s dimensions.
    const width = 928
    const height = width
    const radius = width / 6

    // Create the color scale.
    const color = d3.scaleOrdinal(
      d3.quantize(d3.interpolateRainbow, data.children.length + 1),
    )

    // Compute the layout.
    const hierarchy = d3
      .hierarchy(data)
      .sum((d: any) => d.value)
      .sort((a, b) => (a == null && b == null ? 0 : b.value - a.value))
    const root = d3.partition().size([2 * Math.PI, hierarchy.height + 1])(
      hierarchy,
    )
    root.each((d: any) => (d.current = d))

    // Create the arc generator.
    const arc = d3
      .arc()
      .startAngle((d: any) => d.x0)
      .endAngle((d: any) => d.x1)
      .padAngle((d: any) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius((d: any) => d.y0 * radius)
      .outerRadius((d: any) => Math.max(d.y0 * radius, d.y1 * radius - 1))

    // Create the SVG container.
    const svg = d3
      .select(`#sunburst-${id}`)
      .append('svg')
      .attr('viewBox', [-width / 2, -height / 2, width, width])
      .style('font', '10px sans-serif')

    // Append the arcs.
    const path = svg
      .append('g')
      .selectAll('path')
      .data(root.descendants().slice(1))
      .join('path')
      .attr('fill', (d: any) => {
        while (d.depth > 1) d = d.parent
        return color(d.data.name)
      })
      .attr('fill-opacity', (d: any) =>
        arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0,
      )
      .attr('pointer-events', (d: any) =>
        arcVisible(d.current) ? 'auto' : 'none',
      )

      .attr('d', (d: any) => arc(d.current))

    // Make them clickable if they have children.
    path
      .filter((d: any) => d.children)
      .style('cursor', 'pointer')
      .on('click', clicked)

    const format = d3.format(',d')
    path.append('title').text(
      (d: any) =>
        `${d
          .ancestors()
          .map((d: any) => d.data.name)
          .reverse()
          .join('/')}\n${format(d.value)}`,
    )

    const label = svg
      .append('g')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .style('user-select', 'none')
      .selectAll('text')
      .data(root.descendants().slice(1))
      .join('text')
      .style('font-size', '1rem')
      .style('line-height', '1rem')
      .attr('dy', '0.4em')
      .attr('fill', 'var(--theme-neutral-950)')
      .attr('fill-opacity', (d: any) => +labelVisible(d.current))
      .attr('transform', (d: any) => labelTransform(d.current))
      .text((d: any) => `${d.data.name}`)

    const typeLabel = svg
      .append('g')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .style('user-select', 'none')
      .selectAll('text')
      .data(root.descendants().slice(1))
      .join('text')
      .style('font-size', '1rem')
      .style('line-height', '1rem')
      .attr('dy', '-1em')
      .attr('fill', 'var(--theme-neutral-950)')
      .attr('fill-opacity', (d: any) => +labelVisible(d.current))
      .attr('transform', (d: any) => labelTransform(d.current))
      .text((d: any) => `${d.data.nodeType}`)

    const parent = svg
      .append('circle')
      .datum(root)
      .attr('r', radius)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('click', clicked)

    // Handle zoom on click.
    function clicked(event, p) {
      parent.datum(p.parent || root)

      root.each(
        (d: any) =>
          (d.target = {
            x0:
              Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) *
              2 *
              Math.PI,
            x1:
              Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) *
              2 *
              Math.PI,
            y0: Math.max(0, d.y0 - p.depth),
            y1: Math.max(0, d.y1 - p.depth),
          }),
      )

      const t = svg.transition().duration(750)

      // Transition the data on all arcs, even the ones that aren’t visible,
      // so that if this transition is interrupted, entering arcs will start
      // the next transition from the desired position.
      path
        .transition(t)
        .tween('data', (d: any) => {
          const i = d3.interpolate(d.current, d.target)
          return (t) => (d.current = i(t))
        })
        .filter(function (d: any) {
          return +this.getAttribute('fill-opacity') || arcVisible(d.target)
        })
        .attr('fill-opacity', (d: any) =>
          arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0,
        )
        .attr('pointer-events', (d: any) =>
          arcVisible(d.target) ? 'auto' : 'none',
        )

        .attrTween('d', (d: any) => () => arc(d.current))

      label
        .filter(function (d: any) {
          return +this.getAttribute('fill-opacity') || labelVisible(d.target)
        })
        .transition(t)
        .attr('fill-opacity', (d: any) => +labelVisible(d.target))
        .attrTween('transform', (d: any) => () => labelTransform(d.current))

      typeLabel
        .filter(function (d: any) {
          return +this.getAttribute('fill-opacity') || labelVisible(d.target)
        })
        .transition(t)
        .attr('fill-opacity', (d: any) => +labelVisible(d.target))
        .attrTween('transform', (d: any) => () => labelTransform(d.current))
    }

    function arcVisible(d: any) {
      return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0
    }

    function labelVisible(d: any) {
      return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03
    }

    function labelTransform(d: any) {
      const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI
      const y = ((d.y0 + d.y1) / 2) * radius
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`
    }

    return svg.node()
  }

  onMount(() => {
    setTimeout(() => {
      renderDiagram()
    }, 500)
  })
  function autoBox() {
    document.body.appendChild(this)
    const { x, y, width, height } = this.getBBox()
    document.body.removeChild(this)
    return [x, y, width, height]
  }
</script>

<div id={`sunburst-${id}`} style="width:100%"></div>
