import fs from 'fs'
import yaml from 'js-yaml'
import { Octokit, App } from 'octokit'
import tar from 'tar-fs'
import gunzip from 'gunzip-maybe'
import stream from 'stream'
import { Log } from '../log'
import { NebulaCaCertInput, NebulaConfig, NebulaConfigInput, NebulaHostCertInput, NebulaInstallInput, NebulaReceiveCertInput, NebulaSendCertInput } from './types'
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

class NebulaCert {
  public isInstalled:boolean
  constructor() {
    this.isInstalled = fs.existsSync('/usr/local/bin/nebula-cert')
  }
  generateCaCertificate({ name }:NebulaCaCertInput) {
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
  generateHostCertificate({ isOwn, name, nebulaIp, groups }:NebulaHostCertInput) {
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
  sendCert({ groupId, nodeId, deviceId, name, nebulaIp, groups }:NebulaSendCertInput) {
    return new Promise<void>(async (resolve, reject) => {
      await this.generateHostCertificate({ isOwn: false, name, nebulaIp, groups })
      const payload:UPayload = {
        metrics: [{
          name: 'nebula/applyCertificate',
          type: 'String',
          value: JSON.stringify({
            ca: fs.readFileSync('/etc/squid/nebula/ca.crt').toString(),
            host: fs.readFileSync(`/etc/squid/nebula/${name}.crt`).toString(),
            key: fs.readFileSync(`/etc/squid/nebula/${name}.key`).toString(),
          })
        }]
      }
      await mqtt.sendDeviceCommand({ groupId, nodeId, deviceId, payload })
    })
  }
  requestCert({ groupId, nodeId, deviceId, name, nebulaIp, groups }:NebulaSendCertInput) {
    return new Promise<void>(async (resolve, reject) => {
      const payload:UPayload = {
        metrics: [{
          name: 'nebula/requestCertificate',
          type: 'String',
          value: JSON.stringify({
            name,
            nebulaIp,
            groups
          })
        }]
      }
      await mqtt.sendDeviceCommand({ groupId, nodeId, deviceId, payload })
    })
  }
  receiveCert({ ca, cert, key }:NebulaReceiveCertInput) {
    return new Promise<void>((resolve, reject) => {
      fs.writeFileSync('/etc/squid/nebula/ca.crt', ca)
      fs.writeFileSync(`/etc/squid/nebula/cert.crt`, cert)
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
    return fs.existsSync('/etc/squid/nebula/ca.crt') && fs.existsSync('/etc/squid/nebula/ca.key') && fs.existsSync('/etc/squid/nebula/ca.png')
  }
  get hasCaCertificate() {
    return fs.existsSync('/etc/squid/nebula/ca.crt')
  }
  get hasHostCertificate() {
    return fs.existsSync(`/etc/squid/nebula/host.crt`) && fs.existsSync(`/etc/squid/nebula/host.key`) && fs.existsSync(`/etc/squid/nebula/host.png`)
  }
}

class Nebula extends MQTTData {
  private cert:NebulaCert
  public isLighthouse:boolean
  constructor() {
    const metrics:MqttDataMetric[] = [{
      name: 'nebula/status',
      getter: async () => this.getState(),
      type: 'String'
    },{
      name: 'nebula/isLightHouse',
      getter: async () => this.isLighthouse,
      type: 'Boolean'
    }]
    const deviceControl:MqttDataDeviceControl[] = [{
      name: 'nebula/install',
      action: (args:any) => { this.install(args) },
      args: [{
        name: 'isLighthouse',
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
      name: 'nebula/setCertificate',
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
      }]
    }]
    super(metrics, deviceControl)
    this.isLighthouse = false
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
    if (!this.isInstalled) {
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
      this.configure({ isLighthouse, lighthouse })
      if (isLighthouse) {
        await this.generateCaCertificate({ name: 'Squid' })
        this.isLighthouse = true
        await this.installService()
      } else {
        if (lighthouseGroupId && lighthouseNodeId && lighthouseDeviceId && nebulaIp) {
          await this.cert.requestCert({ 
            groupId: lighthouseGroupId, 
            nodeId: lighthouseNodeId, 
            deviceId: lighthouseDeviceId, 
            nebulaIp, 
            groups, 
            name, 
          })
        } else {
          throw Error(`Need lighthoue group, node, and device ids to request a certificate. Got: ${JSON.stringify({ lighthouseGroupId, lighthouseNodeId, lighthouseDeviceId, nebulaIp, groups, name },null,2)}`)        
        }
      }
    } else {
      throw Error('Nebula is already installed.')
    }
  }
  configure({ isLighthouse, lighthouse }:NebulaConfigInput) {
    if (!this.isConfigured) {
      this.config = getDefaultConfig({ isLighthouse, lighthouse })
      const configYaml = yaml.dump(this.config)
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
  async installService() {
    const config = getSystemdConfig()
    fs.writeFileSync('/etc/systemd/system/squid-nebula.service', config)
    await runCommand('sudo systemctl daemon-reload')
    await runCommand('sudo systemctl enable squid-nebula')
    await runCommand('sudo systemctl start squid-nebula')
    const isRunning = await this.getIsServiceRunning()
    if (isRunning) {
      log.info('Nebula service was successfully installed.')
    } else {
      throw Error('Nebula service was not successfully installed.')
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
    await this.installService()
  }
  getIsServiceRunning() {
    return runCommand('systemctl is-active --quiet squid-nebula').then(() => {
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
}

export const nebula = new Nebula()