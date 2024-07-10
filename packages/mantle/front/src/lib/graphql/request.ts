import { env } from '$env/dynamic/private'

export const sendRequest = ({
  query,
  variables,
  token
}: {
  query: string
  variables?: { [key: string]: unknown }
  token?: string
}) => {
  const protocol = env.MANTLE_PROTOCOL || 'http'
  const host = env.MANTLE_HOST || 'localhost'
  const port = env.MANTLE_PORT || '4001'
  const url = env.MANTLE_URL || '/graphql'
  const headers: { [key: string]: string } = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return fetch(`${protocol}://${host}:${port}${url}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables
    })
  })
    .then((res) => {
      if (!res.ok) {
        throw Error(res.statusText)
      }
      return res.json()
    })
    .then((res) => {
      if (res.errors) {
        throw Error(res.errors[0].message)
      }
      return res.data
    })
    .catch((err) => {
      throw Error(err)
    })
}
