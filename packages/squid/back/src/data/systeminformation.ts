import si from 'systeminformation'
import { MQTTData, type MqttDataMetric } from '../mqtt/index.js'

export class System extends MQTTData {
  constructor() {
    const metrics: MqttDataMetric[] = [
      {
        name: 'systemInformation/os/platform',
        getter: async () => si.osInfo().then((data: any) => data.platform),
        type: 'String'
      },
      {
        name: 'systemInformation/os/distro',
        getter: async () => si.osInfo().then((data: any) => data.distro),
        type: 'String'
      },
      {
        name: 'systemInformation/os/release',
        getter: async () => si.osInfo().then((data: any) => data.release),
        type: 'String'
      },
      {
        name: 'systemInformation/os/arch',
        getter: async () => si.osInfo().then((data: any) => data.arch),
        type: 'String'
      },
      {
        name: 'systemInformation/os/hostname',
        getter: async () => si.osInfo().then((data: any) => data.hostname),
        type: 'String'
      },
      {
        name: 'systemInformation/os/fqdn',
        getter: async () => si.osInfo().then((data: any) => data.fqdn),
        type: 'String'
      },
      {
        name: 'systemInformation/cpu/processors',
        getter: async () => si.cpu().then((data: any) => data.processors),
        type: 'Float'
      },
      {
        name: 'systemInformation/cpu/physicalCores',
        getter: async () => si.cpu().then((data: any) => data.physicalCores),
        type: 'Float'
      },
      {
        name: 'systemInformation/cpu/cores',
        getter: async () => si.cpu().then((data: any) => data.cores),
        type: 'Float'
      },
      {
        name: 'systemInformation/avgLoad',
        getter: async () => si.currentLoad().then((data: any) => data.avgLoad),
        type: 'Float'
      },
      {
        name: 'systemInformation/mem/used',
        getter: async () => si.mem().then((data: any) => data.used),
        type: 'Float'
      },
      {
        name: 'systemInformation/mem/used/gigabytes',
        getter: async () =>
          si.mem().then((data: any) => data.used / (1024 * 1024 * 1024)),
        type: 'Float'
      },
      {
        name: 'systemInformation/mem/total',
        getter: async () => si.mem().then((data: any) => data.total),
        type: 'Float'
      },
      {
        name: 'systemInformation/mem/total/gigabytes',
        getter: async () =>
          si.mem().then((data: any) => data.total / (1024 * 1024 * 1024)),
        type: 'Float'
      },
      {
        name: 'systemInformation/temp',
        getter: async () => si.cpuTemperature().then((data: any) => data.main),
        type: 'Float'
      },
      {
        name: 'systemInformation/disk/size',
        getter: async () => si.fsSize().then((data: any) => data[0].size),
        type: 'Float'
      },
      {
        name: 'systemInformation/disk/size/gigabytes',
        getter: async () =>
          si.fsSize().then((data: any) => data[0].size / (1024 * 1024 * 1024)),
        type: 'Float'
      },
      {
        name: 'systemInformation/disk/used',
        getter: async () => si.fsSize().then((data: any) => data[0].used),
        type: 'Float'
      },
      {
        name: 'systemInformation/disk/used/gigabytes',
        getter: async () =>
          si.fsSize().then((data: any) => data[0].used / (1024 * 1024 * 1024)),
        type: 'Float'
      }
    ]
    super(metrics)
  }
}
