import si from 'systeminformation'
import { mqtt } from '../mqtt'

interface SystemMetric {
  name: string,
  type: 'Float'
}

export class System {
  private interval?:ReturnType<typeof setInterval>
  private metrics:SystemMetric[]
  constructor() {
    this.metrics = [{
        name: 'systemInformation/avgLoad',
        type: 'Float'
      },{
        name: 'systemInformation/mem/used',
        type: 'Float'
      },{
        name: 'systemInformation/mem/total',
        type: 'Float'
      },{
        name: 'systemInformation/temp',
        type: 'Float'
    }]
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
    // this.metrics.forEach()
    mqtt.addMetric({
      name: 'systemInformation/avgLoad',
      value: await si.currentLoad().then(data => data.avgLoad),
      type: 'Float'
    })
    mqtt.addMetric({
      name: 'systemInformation/mem/used',
      value: await si.mem().then(data => data.used),
      type: 'Float'
    })
    mqtt.addMetric({
      name: 'systemInformation/mem/total',
      value: await si.mem().then(data => data.total),
      type: 'Float'
    })
    mqtt.addMetric({
      name: 'systemInformation/temp',
      value: await si.cpuTemperature().then(data => data.main),
      type: 'Float'
    })
  }
  async updateMetrics() {
    mqtt.updateMetric({
      name: 'systemInformation/avgLoad',
      value: await si.currentLoad().then(data => data.avgLoad),
    })
    mqtt.updateMetric({
      name: 'systemInformation/mem/used',
      value: await si.mem().then(data => data.used),
    })
    mqtt.updateMetric({
      name: 'systemInformation/mem/total',
      value: await si.mem().then(data => data.total),
    })
    mqtt.updateMetric({
      name: 'systemInformation/temp',
      value: await si.cpuTemperature().then(data => data.main),
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