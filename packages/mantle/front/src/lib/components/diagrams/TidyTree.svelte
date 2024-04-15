<script lang="ts">
  import { onMount } from 'svelte'
  import * as d3 from 'd3'

  export let id: string

  interface Heirarchy {
    name: string
    children?: Heirarchy[]
  }

  type SpbHeirarchy = {
    id: string
    nodes?: SpbHeirarchy[]
    devices?: SpbHeirarchy[]
    metrics?: SpbHeirarchy[]
    value?: string
    type?: string
  }

  type Node = {
    children: Node[]
  }

  export let input: SpbHeirarchy

  function truncateChildren(node: Node, maxChildren: number) {
    if (!node.children) return

    // Recursively traverse children first
    node.children.forEach((child) => truncateChildren(child, maxChildren))

    if (node.children.length > maxChildren) {
      const extraCount = node.children.length - maxChildren
      node.children = node.children.slice(0, maxChildren).concat({
        //@ts-expect-error see reason below
        //TODO: investigate typescript error
        name: `+ ${extraCount} more metrics`,
        // Add other properties for the new node as necessary, e.g., nodeType
        nodeType: 'info',
      })
    }
  }

  function deepClone(obj: object): Promise<Node> {
    return new Promise((resolve) => {
      const { port1, port2 } = new MessageChannel()
      port2.onmessage = (event) => resolve(event.data)
      port1.postMessage(obj)
    })
  }

  let svg: any
  async function render(input: any) {
    if (!mounted) return
    if (svg) {
      svg.remove()
    }
    const width = 900
    // const height = 350;
    const truncated = await deepClone(input)
    truncateChildren(truncated, 15)

    const root: any = d3.hierarchy(truncated)
    let fourthLevelNodes = 0

    // Traverse the tree and count nodes at the fourth level (depth is 0-indexed)
    root.each((node: any) => {
      if (node.depth === 3) {
        fourthLevelNodes++
      }
    })

    const verticalSeparation = 16 // Adjust this value based on your desired spacing
    const height =
      fourthLevelNodes * verticalSeparation < 100
        ? 100
        : fourthLevelNodes * verticalSeparation

    const tree = d3.tree().size([height, width - 160])

    tree(root)

    svg = d3
      .select(`#tidy-tree-${id}`)
      .append('svg')
      .attr('viewBox', [0, 0, width * 1.5, height])
      .append('g')
      .attr('transform', 'translate(150,0)')

    const nodes = root.descendants()
    const links = root.links()

    // Draw links
    svg
      .selectAll('.link')
      .data(links)
      .enter()
      .append('path')
      .attr('stroke', 'var(--theme-neutral-300)')
      .attr('fill', 'none')
      .attr(
        'd',
        d3
          .linkHorizontal()
          .x((d: any) => d.y)
          .y((d: any) => d.x),
      )

    // Draw nodes
    const node = svg
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.y},${d.x})`)

    node
      .append('circle')
      .attr('r', (d: any) =>
        ['group', 'node', 'device'].includes(d.data.nodeType) ? 20 : 5,
      )
      .attr('fill', (d: any) =>
        ['group', 'node', 'device'].includes(d.data.nodeType)
          ? 'var(--theme-neutral-300)'
          : ['info'].includes(d.data.nodeType)
            ? 'var(--theme-neutral-300)'
            : 'var(--theme-neutral-400)',
      )

    const iconSize = 7 // Size of the icon, adjust as needed
    const scaleFactor = 7 / iconSize
    node
      .append('path')
      .attr('d', (d: any) => {
        if (d.data.nodeType === 'group') {
          return 'M16,20H20V16H16M16,14H20V10H16M10,8H14V4H10M16,8H20V4H16M10,14H14V10H10M4,14H8V10H4M4,20H8V16H4M10,20H14V16H10M4,8H8V4H4V8Z'
        }
        if (d.data.nodeType === 'node')
          return 'M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z'
        if (d.data.nodeType === 'device')
          return 'M4,5C2.89,5 2,5.89 2,7V17C2,18.11 2.89,19 4,19H20C21.11,19 22,18.11 22,17V7C22,5.89 21.11,5 20,5H4M4.5,7A1,1 0 0,1 5.5,8A1,1 0 0,1 4.5,9A1,1 0 0,1 3.5,8A1,1 0 0,1 4.5,7M7,7H20V17H7V7M8,8V16H11V8H8M12,8V16H15V8H12M16,8V16H19V8H16M9,9H10V10H9V9M13,9H14V10H13V9M17,9H18V10H17V9Z'
        return 'M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5'
      })
      .attr(
        'transform',
        `scale(${10 / iconSize}) translate(${-12 * scaleFactor}, ${-12 * scaleFactor})`,
      ) // Scale to fit within the circle (using circle radius / icon size)
      .style('fill', 'var(--theme-neutral-950)') // Adjust fill as necessary

    node
      .append('text')
      .attr('dy', 3)
      .attr('x', (d: any) => (d.children ? -24 : 24))
      .attr('fill', 'var(--theme-neutral-950)')
      .style('text-anchor', (d: any) => (d.children ? 'end' : 'start'))
      .text((d: any) => d.data.name)
      .clone(true)
      .lower()
      .attr('stroke', 'var(--theme-neutral-50)')
      .attr('stroke-width', 3)
  }
  let mounted = false
  // $: render(input);
  onMount(async () => {
    mounted = true
    render(input)
  })
</script>

<div>
  <div id={`tidy-tree-${id}`}></div>
</div>

<style lang="scss">
</style>
