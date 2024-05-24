export const load = ({ cookies }) => {
  return {
    theme: cookies.get('theme') ?? 'themeLight',
  }
}
