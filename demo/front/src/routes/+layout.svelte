<script lang="ts">
	import type { LayoutData } from './$types'
	import '@fontsource/open-sans'
	import '@fontsource/oswald'
	import '../css/index.scss'
	import PageTransition from '$lib/components/PageTransition.svelte'
	export let data: LayoutData
	//test
</script>

<header>
  <img src="https://res.cloudinary.com/jarautomation/image/upload/w_250,q_auto,f_auto/v1624165394/logos/mantle_light.png" alt="Mantle Logo"/>
</header>

<PageTransition pathname={data.pathname}>
	<slot />
</PageTransition>

<footer>
	
	<p>
		Copyright &#169; <a href="https://github.com/joyja">JAR Automation</a>, {new Date().getFullYear()}
	</p>
</footer>

<style lang="scss">
	header {
		z-index: 2;
		position: absolute;
		& > img {
			padding:var(--spacing-unit);
			height:calc(60px - var(--spacing-unit) * 2);
		}
	}

	footer {
		font-family: "Open Sans";
		margin-top: calc(var(--spacing-unit) * 8);
		text-align: center;
	}
</style>
