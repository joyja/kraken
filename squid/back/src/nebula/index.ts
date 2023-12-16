import fs from 'fs'
import yaml from 'js-yaml'
import { Octokit, App } from 'octokit'
import tar from 'tar-fs'
import gunzip from 'gunzip-maybe'
import stream from 'stream'
import { Log } from '../log'
import { NebulaCaCertInput, NebulaConfig, NebulaConfigInput, NebulaHostCertInput, NebulaInstallInput, NebulaReceiveCertInput, NebulaRequestReceiveCertInput, NebulaRequestSendCertInput, NebulaSendCertInput } from './types'
import { getDefaultConfig } from './defaultConfigs'
import { exec } from 'child_process'
import { getSystemdConfig } from './service'
import { mqtt, MQTTData, MqttDataDeviceControl, type MqttDataMetric } from '../mqtt'
import { UPayload } from 'kraken-sparkplug-client'

const log = new Log('nebula')

const octokit = new Octokit()

function runCommand(command:string) {
  return new Promise<string>((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(err)
      } else {
        resolve(stderr ? stderr : stdout)
      }
    })
  })
}

function getIpCidr(interfaceName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(`ip addr show ${interfaceName}`, (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`Error: ${stderr}`);
        return;
      }

      const match = stdout.match(/inet (\d+\.\d+\.\d+\.\d+\/\d+)/);
      if (match && match[1]) {
        resolve(match[1]);
      } else {
        reject('IP address not found for the interface.');
      }
    });
  });
}

class NebulaCert {
  public isInstalled:boolean
  constructor() {
    this.isInstalled = fs.existsSync('/usr/local/bin/nebula-cert')
  }
  generateCaCertificate({ name, allowOverwrite }:NebulaCaCertInput) {
    if (allowOverwrite) {
      if(fs.existsSync('/etc/squid/nebula/ca.crt')) {
        fs.rmSync('/etc/squid/nebula/ca.crt')
      }
      if(fs.existsSync('/etc/squid/nebula/ca.key')) {
        fs.rmSync('/etc/squid/nebula/ca.key')
      }
      if(fs.existsSync('/etc/squid/nebula/ca.png')) {
        fs.rmSync('/etc/squid/nebula/ca.png')
      }
    }
    return new Promise<void>((resolve, reject) => {
      exec(`nebula-cert ca -name ${name} -out-crt /etc/squid/nebula/ca.crt -out-key /etc/squid/nebula/ca.key -out-qr /etc/squid/nebula/ca.png`, (err, stdout, stderr) => {
        if (err 
          || !fs.existsSync('/etc/squid/nebula/ca.crt') 
          || !fs.existsSync('/etc/squid/nebula/ca.key') 
          || !fs.existsSync('/etc/squid/nebula/ca.png')
        ) {
          reject(`Error generating ca certificate. Error: ${ err ? JSON.stringify(err,null,2) : 'Missing some ca files.'}`)
        } else {
          log.info(`Successfully generated ca certificate.`)
          resolve()
        }
      })
    })
  }
  generateHostCertificate({ isOwn, name, nebulaIp, groups, allowOverwrite }:NebulaHostCertInput) {
    if (allowOverwrite) {
      const certName = isOwn ? 'host' : name
      if (fs.existsSync(`/etc/squid/nebula/${certName}.crt`)) {
        fs.rmSync(`/etc/squid/nebula/${certName}.crt`)
      }
      if (fs.existsSync(`/etc/squid/nebula/${certName}.key`)) {
        fs.rmSync(`/etc/squid/nebula/${certName}.key`)
      }
      if (fs.existsSync(`/etc/squid/nebula/${certName}.png`)) {
        fs.rmSync(`/etc/squid/nebula/${certName}.png`)
      }
    }
    return new Promise<void>((resolve, reject) => {
      const certName = isOwn ? 'host' : name
      exec(`nebula-cert sign -ca-crt /etc/squid/nebula/ca.crt -ca-key /etc/squid/nebula/ca.key -name ${name} -ip ${nebulaIp} ${groups ? `-groups ${groups.join(',')}` : '' } -out-crt /etc/squid/nebula/${certName}.crt -out-key /etc/squid/nebula/${certName}.key -out-qr /etc/squid/nebula/${certName}.png`, (err, stdout, stderr) => {
        if (err 
          || !fs.existsSync(`/etc/squid/nebula/${certName}.crt`) 
          || !fs.existsSync(`/etc/squid/nebula/${certName}.key`) 
          || !fs.existsSync(`/etc/squid/nebula/${certName}.png`)
        ) {
          reject(`Error generating host certificate. Error: ${ err ? JSON.stringify(err,null,2) : 'Missing some host files.'}`)
        } else {
          log.info(`Successfully generated host certificate, ${certName}.crt.`)
          resolve()
        }
      })
    })
  }
  requestSendCert({ groupId, nodeId, deviceId, requesterGroupId, requesterNodeId, requesterDeviceId, name, nebulaIp, groups, allowReinstall }:NebulaRequestSendCertInput) {
    log.info(`Requesting certificate for ${name} from ${groupId}/${nodeId}/${deviceId}.`)
    return new Promise<void>(async (resolve, reject) => {
      const payload:UPayload = {
        metrics: [{
          name: 'Device Control/nebula/sendCertificate',
          type: 'String',
          value: JSON.stringify({
            requesterGroupId, 
            requesterNodeId, 
            requesterDeviceId, 
            name,
            nebulaIp,
            groups,
            allowReinstall,
          })
        }]
      }
      log.debug(`Sending payload: ${JSON.stringify(payload,null,2)}`)
      await mqtt.sendDeviceCommand({ groupId, nodeId, deviceId, payload })
    })
  }
  sendCert({  requesterGroupId, requesterNodeId, requesterDeviceId, name, nebulaIp, groups }:NebulaSendCertInput) {
    log.info(`Sending certificate for ${name} to ${requesterGroupId}/${requesterNodeId}/${requesterDeviceId}.`)
    return new Promise<void>(async (resolve, reject) => {
      await this.generateHostCertificate({ isOwn: false, name, nebulaIp, groups })
      const payload:UPayload = {
        metrics: [{
          name: 'Device Control/nebula/receiveCertificate',
          type: 'String',
          value: JSON.stringify({
            ca: fs.readFileSync('/etc/squid/nebula/ca.crt').toString(),
            cert: fs.readFileSync(`/etc/squid/nebula/${name}.crt`).toString(),
            key: fs.readFileSync(`/etc/squid/nebula/${name}.key`).toString(),
          })
        }]
      }
      log.debug(`Sending payload: ${JSON.stringify(payload,null,2)}`)
      await mqtt.sendDeviceCommand({ groupId: requesterGroupId, nodeId: requesterNodeId, deviceId: requesterDeviceId, payload })
    })
  }
  receiveCert({ ca, cert, key }:NebulaReceiveCertInput) {
    log.info(`Receiving certificate.`)
    log.debug(`ca: ${ca}, cert: ${cert}, key: ${key}`)
    return new Promise<void>((resolve, reject) => {
      fs.writeFileSync('/etc/squid/nebula/ca.crt', ca)
      fs.writeFileSync(`/etc/squid/nebula/host.crt`, cert)
      fs.writeFileSync(`/etc/squid/nebula/host.key`, key)
      resolve()
    })
  }
  state() {
    if (!this.isInstalled) {
      return 'pre-installation'
    } else if (!this.hasCaCertificate) {
      return 'installed, no ca certificate'
    } else if (!this.hasHostCertificate) {
      return 'installed, no host certificate'
    } else {
      return 'installed and certified'
    }
  }
  get hasLighthouseCaCertificate() {
    return fs.existsSync('/etc/squid/nebula/ca.crt') && fs.existsSync('/etc/squid/nebula/ca.key')
  }
  get hasCaCertificate() {
    return fs.existsSync('/etc/squid/nebula/ca.crt')
  }
  get hasHostCertificate() {
    return fs.existsSync(`/etc/squid/nebula/host.crt`) && fs.existsSync(`/etc/squid/nebula/host.key`)
  }
}

class Nebula extends MQTTData {
  private cert:NebulaCert
  constructor() {
    const metrics:MqttDataMetric[] = [{
      name: 'nebula/status',
      getter: async () => this.getState(),
      type: 'String'
    },{
      name: 'nebula/isLightHouse',
      getter: async () => this.isLighthouse,
      type: 'Boolean'
    },{
      name: 'nebula/ip',
      getter: async () => this.getNebulaIp(),
      type: 'String'
    }]
    const deviceControl:MqttDataDeviceControl[] = [{
      name: 'nebula/install',
      action: (args:any) => { this.install(args) },
      args: [{
        name: 'isLighthouse',
        type: 'Boolean'
      },{
        name: 'allowReinstall',
        type: 'Boolean'
      },{
        name: 'lighthouseNebulaIp',
        type: 'String'
      },{
        name: 'lighthousePublicEndpoint',
        type: 'String'
      },{
        name: 'lighthouseGroupId',
        type: 'String'
      },{
        name: 'lighthouseNodeId',
        type: 'String'
      },{
        name: 'lighthouseDeviceId',
        type: 'String'
      },{
        name: 'name',
        type: 'String'
      },{
        name: 'nebulaIp',
        type: 'String'
      },{
        name: 'groups',
        type: 'String'
      },{
        name: 'version',
        type: 'String'
      }]
    },{
      name: 'nebula/sendCertificate',
      action: (args:any) => { this.sendCert(args) },
      args: [{
        name: 'groupId',
        type: 'String'
      },{
        name: 'nodeId',
        type: 'String'
      },{
        name: 'name',
        type: 'String'
      },{
        name: 'nebulaIp',
        type: 'String'
      },{
        name: 'groups',
        type: 'String'
      },{
        name: 'allowReinstall',
        type: 'Boolean'
      }]
    },{
      name: 'nebula/receiveCertificate',
      action: (args:any) => { this.receiveCert(args) },
      args: [{
        name: 'ca',
        type: 'String'
      },{
        name: 'cert',
        type: 'String'
      },{
        name: 'key',
        type: 'String'
      },{
        name: 'allowReinstall',
        type: 'Boolean'
      }]
    }]
    super(metrics, deviceControl)
    this.cert = new NebulaCert()
  }
  fetchReleases() {
    return octokit.request('GET /repos/{owner}/{repo}/releases', {
      owner: 'slackhq',
      repo: 'nebula',
    }).then(({ data }) => {
      return data
    })
  }
  async install({ 
    isLighthouse, 
    lighthouseNebulaIp, 
    lighthousePublicEndpoint, 
    lighthouseGroupId, 
    lighthouseNodeId, 
    lighthouseDeviceId,
    allowReinstall,
    name, 
    nebulaIp, 
    groups, 
    version 
  }:NebulaInstallInput) {
    //Fetch the release information from the github api
    const lighthouse = {
      nebulaIp: lighthouseNebulaIp,
      publicEndpoint: lighthousePublicEndpoint,
    }
    const isRunning = await this.getIsServiceRunning()
    if (allowReinstall && isRunning) {
      await runCommand('sudo systemctl stop squid-nebula.service')
      await runCommand('sudo systemctl disable squid-nebula.service')
    }
    if (!this.isInstalled || allowReinstall) {
      const downloadUrl = await this.fetchReleases()
      .then((releases) => {
        return releases.find((release) => {
            return release.tag_name === version
          })?.assets.find((asset) => {
            return asset.name === 'nebula-linux-amd64.tar.gz'
          })?.browser_download_url
      })
      if (!downloadUrl) {
        throw new Error(`Could not find download url for nebula version ${version}`)
      }
      const tarStream = await octokit.request(downloadUrl,{ request: { parseSuccessResponseBody:false } })
        .then(({ data }) => data)
      await new Promise<void>((resolve,reject) => {
        stream.pipeline(tarStream, gunzip(), tar.extract('/usr/local/bin'),(err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
      if (this.isInstalled) {
        log.info('Nebula was successfully installed.')
      } else {
        throw Error('Nebula was not successfully installed')
      }
      this.configure({ isLighthouse, lighthouse, allowReinstall })
      if (isLighthouse) {
        if (nebulaIp) {
          await this.generateCaCertificate({ name: 'Squid', allowOverwrite: allowReinstall })
          await this.generateHostCertificate({ isOwn: true, name, nebulaIp, groups, allowOverwrite: allowReinstall })
          await this.installService(allowReinstall)
        } else {
          throw Error('Need nebula ip to install lighthouse.')
        }
      } else {
        if (lighthouseGroupId && lighthouseNodeId && lighthouseDeviceId && nebulaIp) {
          await this.cert.requestSendCert({ 
            groupId: lighthouseGroupId, 
            nodeId: lighthouseNodeId, 
            deviceId: lighthouseDeviceId, 
            requesterGroupId: mqtt.groupId!,
            requesterNodeId: mqtt.nodeId!,
            requesterDeviceId: mqtt.deviceId!,
            nebulaIp, 
            groups, 
            name,
            allowReinstall,
          })
        } else {
          throw Error(`Need lighthouse group, node, and device ids to request a certificate. Got: ${JSON.stringify({ lighthouseGroupId, lighthouseNodeId, lighthouseDeviceId, nebulaIp, groups, name },null,2)}`)        
        }
      }
    } else {
      throw Error('Nebula is already installed.')
    }
  }
  configure({ isLighthouse, lighthouse, allowReinstall }:NebulaConfigInput) {
    if (!this.isConfigured || allowReinstall) {
      const config = getDefaultConfig({ isLighthouse, lighthouse })
      const configYaml = yaml.dump(config)
      fs.mkdirSync('/etc/squid/nebula', { recursive: true })
      fs.writeFileSync('/etc/squid/nebula/config.yml', configYaml)
      if (fs.existsSync('/etc/squid/nebula/config.yml')) {
        log.info('Nebula was successfully configured.')
      } else {
        throw Error('Nebula was not successfully configured.')
      }
    } else {
      throw Error('Nebula is already configured.')
    }
  }
  async installService(allowReinstall?:boolean) {
    let isRunning = await this.getIsServiceRunning()
    if (allowReinstall && isRunning) {
      await runCommand('sudo systemctl stop squid-nebula.service')
      await runCommand('sudo systemctl disable squid-nebula.service')
    }
    if (!isRunning || allowReinstall) {
      const config = getSystemdConfig()
      fs.writeFileSync('/etc/systemd/system/squid-nebula.service', config)
      await runCommand('sudo systemctl daemon-reload')
      await runCommand('sudo systemctl enable squid-nebula.service')
      await runCommand('sudo systemctl start squid-nebula.service')
      isRunning = await this.getIsServiceRunning()
      if (isRunning) {
        log.info('Nebula service was successfully installed.')
      } else {
        throw Error('Nebula service was not successfully installed.')
      }
    } else {
      throw Error('Nebula service is already installed.')
    }
  }
  generateHostCertificate(args:NebulaHostCertInput) {
    return this.cert.generateHostCertificate(args)
  }
  generateCaCertificate(args:NebulaCaCertInput) {
    return this.cert.generateCaCertificate(args)
  }
  sendCert(args:NebulaSendCertInput) {
    return this.cert.sendCert(args)
  }
  async receiveCert(args:NebulaReceiveCertInput) {
    await this.cert.receiveCert(args)
    await this.installService(args.allowReinstall)
  }
  getIsServiceRunning() {
    return runCommand('systemctl is-active --quiet squid-nebula.service').then(() => {
      return true
    }).catch((err) => {
      return false
    })
  }
  async getState() {
    const isRunning = await this.getIsServiceRunning()
    if (!this.isInstalled) {
      return 'pre-installation'
    } else if (!this.isConfigured) {
      return 'pre-configuration'
    } else if (!this.cert.hasCaCertificate) {
      return 'installed, no ca certificate'
    } else if (!this.cert.hasHostCertificate) {
      return 'installed, no host certificate'
    } else if (!isRunning) {
      return 'installed and certified, service not running'
    } else {
      return 'installed and certified, service running'
    }
  }
  getNebulaIp() {
    return getIpCidr('squid-nebula').catch((err) => { 
      // log.debug(`Couldn't retrieve nebula ip: ${err}`)
      return null
    })
  }
  get isConfigured() {
    return fs.existsSync('/etc/squid/nebula/config.yml')
  }
  get isInstalled() {
    return fs.existsSync('/usr/local/bin/nebula') && fs.existsSync('/usr/local/bin/nebula-cert')
  }
  get config() {
    const configPath = '/etc/squid/nebula/config.yml'
    if (fs.existsSync(configPath)) {
      return (yaml.load(fs.readFileSync(configPath,'utf-8')) as NebulaConfig)
    } else {
      return null
    }
  }
  get isLighthouse() {
    return !!this.config?.lighthouse?.am_lighthouse
  }
}

export const nebula = new Nebula()