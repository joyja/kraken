import { sendRequest } from "$lib/graphql/request"
import * as query from "$lib/graphql/query"

export async function load({ url }) {  
  let message
  const config = await sendRequest({
    query: query.config
  })
    .then(res => res.data?.configuration)
    .catch(error => {
      message = error.message
  })
  const programs = await sendRequest({
    query: query.programs
  })
    .then((res) => res.data?.programs)
    .catch(error => {
      message = error.message
    })
  const classes = await sendRequest({
    query: query.classes
  })
    .then(res => res.data?.tClasses)
    .catch(error => {
      message = error.message
    })

  const codeserverHost = process.env.TENTACLE_CODESERVER_HOST || url.hostname
  const codeserverProtocol = process.env.TENTACLE_CODESERVER_PROTOCOL || 'http'
  const codeserverPort = process.env.TENTACLE_CODESERVER_PORT || 8080
  const codeserverUrl = process.env.TENTACLE_CODESERVER_URL || '/'
  const codeserverEndpoint = `${codeserverProtocol}://${codeserverHost}:${codeserverPort}${codeserverUrl}`
  const running = await sendRequest({
    query: query.plc
  })
    .then(res => res.data?.tPlc.running)
    .catch(error => {
      message = error.message
    })
  return {
    running,
    message,
    config,
    programs,
    classes,
    mqtt: config.mqtt || [],
    opcua: config.opcua || [],
    modbus: config.modbus || [],
    codeserverEndpoint
  }
}