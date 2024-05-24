export const slugFromPath = (path: string) =>
  path.match(/([\w-]+)\.(svelte\.md|md|svx)/i)?.[1] ?? null

export const packageFromPath = (path: string) => {
  // This regex captures the first directory name after "/src/lib/markdown/"
  const match = path.match(
    /\/src\/lib\/markdown\/([\w-]+)\/[\w-]+\.(md|svx|svelte\.md)$/i,
  )
  return match ? match[1] : null
}
