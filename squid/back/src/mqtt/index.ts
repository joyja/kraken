import SparkplugClientLib from 'sparkplug-client'

export class MQTT {
  public client:ReturnType<typeof SparkplugClientLib.newClient>
  public connecting:boolean
  public connected:boolean
  constructor() {
    const serverUrl = process.env.SQUID_MQTT_URL
    const username = process.env.SQUID_MQTT_USERNAME
    const password = process.env.SQUID_MQTT_PASSWORD
    const groupId = process.env.SQUID_MQTT_GROUPID
    const edgeNode = process.env.SQUID_EDGENODE
    const clientId = process.env.SQUID_CLIENTID
    const config = {
      serverUrl, username, password, groupId, edgeNode, clientId,
      'version' : 'spBv1.0'
    }
    for (const [key, value] of Object.entries(config)) {
      if (!value) {
        throw Error(`${key} is not set, please make sure you set the SQUID_${key.toUpperCase()} environment variable.`)
      }
    }
    this.client = SparkplugClientLib.newClient(config as SparkplugClientLib.ISparkplugClientOptions)
    this.connecting = false;
    this.connected = false;
  }
}