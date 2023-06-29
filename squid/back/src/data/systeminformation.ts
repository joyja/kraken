import si from 'systeminformation'
import { mqtt } from '../mqtt'

export class System {
  private interval?:ReturnType<typeof setInterval>
  constructor() {
  }
  getCpu() {
    si.cpu()
      .then(data => console.log(data))
      .catch(error => console.error(error));
  }
  getCurrentLoad() {
    si.currentLoad()
    .then(data => console.log(data))
    .catch(error => console.error(error));
  }
  async initializeMetrics() {
    mqtt.addMetric({
      name: 'systemInformation/currentLoad',
      value: await si.currentLoad().then(data => data.currentLoad),
      type: 'Float'
    })
  }
  async updateMetrics() {
    mqtt.updateMetric({
      name: 'systemInformation/currentLoad',
      value: await si.currentLoad().then(data => data.currentLoad),
    })
  }
  async startPolling() {
    this.interval = setInterval(() => {
      this.updateMetrics()
    })
  }
  async stopPolling() {
    clearInterval(this.interval)
  }
}