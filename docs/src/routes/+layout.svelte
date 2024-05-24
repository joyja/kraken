<script>
  const menu = {
    tentacle: {
      text: 'Tentacle',
      children: [
        {
          text: 'Introduction',
          filename: 'introduction',
        },
        {
          text: 'Getting Started',
          filename: 'getting-started',
        },
        {
          text: 'Directory Structure',
          filename: 'directory-structure',
        },
        {
          text: 'Variables',
          filename: 'variables',
        },
        {
          text: 'Programs & Tasks',
          filename: 'programs-and-tasks',
        },
        {
          text: 'Classes',
          filename: 'classes',
        },
        {
          text: 'GraphQL',
          filename: 'graphql',
        },
        {
          text: 'MQTT',
          filename: 'mqtt',
        },
        {
          text: 'User Interface',
          filename: 'user-interface',
        },
        {
          text: 'Example Architecture',
          filename: 'example-architecture',
        },
      ],
    },
  }
</script>

<div class="menu">
  {#each Object.keys(menu) as product}
    <ul>
      {#each menu[product].children as child}
        <li><a href={`/${product}/${child.filename}`}>{child.text}</a></li>
      {/each}
    </ul>
  {/each}
</div>
<slot />
