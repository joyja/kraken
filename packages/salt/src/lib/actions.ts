import type { Action } from '@sveltejs/kit'

export const setTheme: Action = async ({ request, cookies }) => {
  const data = await request.formData()
  const theme = data.get('theme') as string
  cookies.set(`theme`, theme, {
    path: '/',
    secure: false
  })
  const themeName = theme === 'themeDark' ? 'dark mode' : 'light mode'
  return {
    context: 'setTheme',
    type: 'success',
    message: `You are now in ${themeName}.`,
    theme
  }
}
