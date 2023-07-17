import si from 'systeminformation'
import { mqtt } from '../mqtt'

interface SystemMetric {
  name: string,
  getter: Function,
  type: 'Float' | 'String'
}

export class System {
  private interval?:ReturnType<typeof setInterval>
  private metrics:SystemMetric[]
  constructor() {
    this.metrics = [{
        name: 'systemInformation/os/platform',
        getter: async () => si.osInfo().then(data => data.platform),
        type: 'String'
      },{
        name: 'systemInformation/os/distro',
        getter: async () => si.osInfo().then(data => data.distro),
        type: 'String'
      },{
        name: 'systemInformation/os/release',
        getter: async () => si.osInfo().then(data => data.release),
        type: 'String'
      },{
        name: 'systemInformation/os/arch',
        getter: async () => si.osInfo().then(data => data.arch),
        type: 'String'
      },{
        name: 'systemInformation/os/hostname',
        getter: async () => si.osInfo().then(data => data.hostname),
        type: 'String'
      },{
        name: 'systemInformation/os/fqdn',
        getter: async () => si.osInfo().then(data => data.fqdn),
        type: 'String'
      },{
        name: 'systemInformation/cpu/processors',
        getter: async () => si.cpu().then(data => data.processors),
        type: 'Float'
      },{
        name: 'systemInformation/cpu/physicalCores',
        getter: async () => si.cpu().then(data => data.physicalCores),
        type: 'Float'
      },{
        name: 'systemInformation/cpu/cores',
        getter: async () => si.cpu().then(data => data.cores),
        type: 'Float'
      },{
        name: 'systemInformation/avgLoad',
        getter: async () => si.currentLoad().then(data => data.avgLoad),
        type: 'Float'
      },{
        name: 'systemInformation/mem/used',
        getter: async () => si.mem().then(data => data.used),
        type: 'Float'
      },{
        name: 'systemInformation/mem/total',
        getter: async () => si.mem().then(data => data.total),
        type: 'Float'
      },{
        name: 'systemInformation/temp',
        getter: async () => si.cpuTemperature().then(data => data.main),
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
    await Promise.all(this.metrics.map(async (metric) => {
      mqtt.addMetric({
        name: metric.name,
        value: await metric.getter(),
        type: metric.type
      })
    }))
  }
  async updateMetrics() {
    await Promise.all(this.metrics.map(async (metric) => {
      mqtt.updateMetric({
        name: metric.name,
        value: await metric.getter(),
      })
    }))
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