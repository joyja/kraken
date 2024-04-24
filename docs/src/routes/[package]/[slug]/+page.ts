import { packageFromPath } from '$lib/parsePath.js'
import { slugFromPath } from '$lib/parsePath'
import { error } from '@sveltejs/kit'

export const load = async ({ params }) => {
  const modules = import.meta.glob(`/src/lib/markdown/*/*.{md,svx,svelte.md}`)

  let match: { path?: string; resolver?: App.MdsvexResolver } = {}
  for (const [path, resolver] of Object.entries(modules)) {
    console.log(
      packageFromPath(path),
      params.package,
      slugFromPath(path),
      params.slug,
    )
    if (
      packageFromPath(path) === params.package &&
      slugFromPath(path) === params.slug
    ) {
      match = { path, resolver: resolver as unknown as App.MdsvexResolver }
      break
    }
  }

  const post = await match?.resolver?.()

  if (!post) {
    throw error(404) // Couldn't resolve the post
  }

  return {
    component: post.default,
    frontmatter: post.metadata,
  }
}
