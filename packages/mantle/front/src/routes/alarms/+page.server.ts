import { sendRequest } from '$lib/graphql/request.js'
import { actions as saltActions } from 'kraken-salt'
import * as query from '$lib/graphql/query'
const { setTheme } = saltActions

export const actions = {
  setTheme,
}

export const load = async () => {
  const alarmHistory = await sendRequest({ query: query.alarmHistory }).then(
    (res) => res.alarmHistory,
  )
  return {
    alarmHistory,
  }
}
