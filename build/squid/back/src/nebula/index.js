"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nebula = void 0;
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const octokit_1 = require("octokit");
const tar_fs_1 = __importDefault(require("tar-fs"));
const gunzip_maybe_1 = __importDefault(require("gunzip-maybe"));
const stream_1 = __importDefault(require("stream"));
const log_1 = require("../log");
const defaultConfigs_1 = require("./defaultConfigs");
const child_process_1 = require("child_process");
const service_1 = require("./service");
const mqtt_1 = require("../mqtt");
const log = new log_1.Log('nebula');
const octokit = new octokit_1.Octokit();
function runCommand(command) {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(command, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(stderr ? stderr : stdout);
            }
        });
    });
}
function getIpCidr(interfaceName) {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(`ip addr show ${interfaceName}`, (error, stdout, stderr) => {
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
            }
            else {
                reject('IP address not found for the interface.');
            }
        });
    });
}
class NebulaCert {
    isInstalled;
    constructor() {
        this.isInstalled = fs_1.default.existsSync('/usr/local/bin/nebula-cert');
    }
    generateCaCertificate({ name, allowOverwrite }) {
        if (allowOverwrite) {
            if (fs_1.default.existsSync('/etc/squid/nebula/ca.crt')) {
                fs_1.default.rmSync('/etc/squid/nebula/ca.crt');
            }
            if (fs_1.default.existsSync('/etc/squid/nebula/ca.key')) {
                fs_1.default.rmSync('/etc/squid/nebula/ca.key');
            }
            if (fs_1.default.existsSync('/etc/squid/nebula/ca.png')) {
                fs_1.default.rmSync('/etc/squid/nebula/ca.png');
            }
        }
        return new Promise((resolve, reject) => {
            (0, child_process_1.exec)(`nebula-cert ca -name ${name} -out-crt /etc/squid/nebula/ca.crt -out-key /etc/squid/nebula/ca.key -out-qr /etc/squid/nebula/ca.png`, (err, stdout, stderr) => {
                if (err
                    || !fs_1.default.existsSync('/etc/squid/nebula/ca.crt')
                    || !fs_1.default.existsSync('/etc/squid/nebula/ca.key')
                    || !fs_1.default.existsSync('/etc/squid/nebula/ca.png')) {
                    reject(`Error generating ca certificate. Error: ${err ? JSON.stringify(err, null, 2) : 'Missing some ca files.'}`);
                }
                else {
                    log.info(`Successfully generated ca certificate.`);
                    resolve();
                }
            });
        });
    }
    generateHostCertificate({ isOwn, name, nebulaIp, groups, allowOverwrite }) {
        if (allowOverwrite) {
            const certName = isOwn ? 'host' : name;
            if (fs_1.default.existsSync(`/etc/squid/nebula/${certName}.crt`)) {
                fs_1.default.rmSync(`/etc/squid/nebula/${certName}.crt`);
            }
            if (fs_1.default.existsSync(`/etc/squid/nebula/${certName}.key`)) {
                fs_1.default.rmSync(`/etc/squid/nebula/${certName}.key`);
            }
            if (fs_1.default.existsSync(`/etc/squid/nebula/${certName}.png`)) {
                fs_1.default.rmSync(`/etc/squid/nebula/${certName}.png`);
            }
        }
        return new Promise((resolve, reject) => {
            const certName = isOwn ? 'host' : name;
            (0, child_process_1.exec)(`nebula-cert sign -ca-crt /etc/squid/nebula/ca.crt -ca-key /etc/squid/nebula/ca.key -name ${name} -ip ${nebulaIp} ${groups ? `-groups ${groups.join(',')}` : ''} -out-crt /etc/squid/nebula/${certName}.crt -out-key /etc/squid/nebula/${certName}.key -out-qr /etc/squid/nebula/${certName}.png`, (err, stdout, stderr) => {
                if (err
                    || !fs_1.default.existsSync(`/etc/squid/nebula/${certName}.crt`)
                    || !fs_1.default.existsSync(`/etc/squid/nebula/${certName}.key`)
                    || !fs_1.default.existsSync(`/etc/squid/nebula/${certName}.png`)) {
                    reject(`Error generating host certificate. Error: ${err ? JSON.stringify(err, null, 2) : 'Missing some host files.'}`);
                }
                else {
                    log.info(`Successfully generated host certificate, ${certName}.crt.`);
                    resolve();
                }
            });
        });
    }
    requestSendCert({ groupId, nodeId, deviceId, requesterGroupId, requesterNodeId, requesterDeviceId, name, nebulaIp, groups, allowReinstall }) {
        log.info(`Requesting certificate for ${name} from ${groupId}/${nodeId}/${deviceId}.`);
        return new Promise(async (resolve, reject) => {
            const payload = {
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
            };
            log.debug(`Sending payload: ${JSON.stringify(payload, null, 2)}`);
            await mqtt_1.mqtt.sendDeviceCommand({ groupId, nodeId, deviceId, payload });
        });
    }
    sendCert({ requesterGroupId, requesterNodeId, requesterDeviceId, name, nebulaIp, groups }) {
        log.info(`Sending certificate for ${name} to ${requesterGroupId}/${requesterNodeId}/${requesterDeviceId}.`);
        return new Promise(async (resolve, reject) => {
            await this.generateHostCertificate({ isOwn: false, name, nebulaIp, groups });
            const payload = {
                metrics: [{
                        name: 'Device Control/nebula/receiveCertificate',
                        type: 'String',
                        value: JSON.stringify({
                            ca: fs_1.default.readFileSync('/etc/squid/nebula/ca.crt').toString(),
                            cert: fs_1.default.readFileSync(`/etc/squid/nebula/${name}.crt`).toString(),
                            key: fs_1.default.readFileSync(`/etc/squid/nebula/${name}.key`).toString(),
                        })
                    }]
            };
            log.debug(`Sending payload: ${JSON.stringify(payload, null, 2)}`);
            await mqtt_1.mqtt.sendDeviceCommand({ groupId: requesterGroupId, nodeId: requesterNodeId, deviceId: requesterDeviceId, payload });
        });
    }
    receiveCert({ ca, cert, key }) {
        log.info(`Receiving certificate.`);
        log.debug(`ca: ${ca}, cert: ${cert}, key: ${key}`);
        return new Promise((resolve, reject) => {
            fs_1.default.writeFileSync('/etc/squid/nebula/ca.crt', ca);
            fs_1.default.writeFileSync(`/etc/squid/nebula/host.crt`, cert);
            fs_1.default.writeFileSync(`/etc/squid/nebula/host.key`, key);
            resolve();
        });
    }
    state() {
        if (!this.isInstalled) {
            return 'pre-installation';
        }
        else if (!this.hasCaCertificate) {
            return 'installed, no ca certificate';
        }
        else if (!this.hasHostCertificate) {
            return 'installed, no host certificate';
        }
        else {
            return 'installed and certified';
        }
    }
    get hasLighthouseCaCertificate() {
        return fs_1.default.existsSync('/etc/squid/nebula/ca.crt') && fs_1.default.existsSync('/etc/squid/nebula/ca.key');
    }
    get hasCaCertificate() {
        return fs_1.default.existsSync('/etc/squid/nebula/ca.crt');
    }
    get hasHostCertificate() {
        return fs_1.default.existsSync(`/etc/squid/nebula/host.crt`) && fs_1.default.existsSync(`/etc/squid/nebula/host.key`);
    }
}
class Nebula extends mqtt_1.MQTTData {
    cert;
    constructor() {
        const metrics = [{
                name: 'nebula/status',
                getter: async () => this.getState(),
                type: 'String'
            }, {
                name: 'nebula/isLightHouse',
                getter: async () => this.isLighthouse,
                type: 'Boolean'
            }, {
                name: 'nebula/ip',
                getter: async () => this.getNebulaIp(),
                type: 'String'
            }];
        const deviceControl = [{
                name: 'nebula/install',
                action: (args) => { this.install(args); },
                args: [{
                        name: 'isLighthouse',
                        type: 'Boolean'
                    }, {
                        name: 'allowReinstall',
                        type: 'Boolean'
                    }, {
                        name: 'lighthouseNebulaIp',
                        type: 'String'
                    }, {
                        name: 'lighthousePublicEndpoint',
                        type: 'String'
                    }, {
                        name: 'lighthouseGroupId',
                        type: 'String'
                    }, {
                        name: 'lighthouseNodeId',
                        type: 'String'
                    }, {
                        name: 'lighthouseDeviceId',
                        type: 'String'
                    }, {
                        name: 'name',
                        type: 'String'
                    }, {
                        name: 'nebulaIp',
                        type: 'String'
                    }, {
                        name: 'groups',
                        type: 'String'
                    }, {
                        name: 'version',
                        type: 'String'
                    }]
            }, {
                name: 'nebula/sendCertificate',
                action: (args) => { this.sendCert(args); },
                args: [{
                        name: 'groupId',
                        type: 'String'
                    }, {
                        name: 'nodeId',
                        type: 'String'
                    }, {
                        name: 'name',
                        type: 'String'
                    }, {
                        name: 'nebulaIp',
                        type: 'String'
                    }, {
                        name: 'groups',
                        type: 'String'
                    }, {
                        name: 'allowReinstall',
                        type: 'Boolean'
                    }]
            }, {
                name: 'nebula/receiveCertificate',
                action: (args) => { this.receiveCert(args); },
                args: [{
                        name: 'ca',
                        type: 'String'
                    }, {
                        name: 'cert',
                        type: 'String'
                    }, {
                        name: 'key',
                        type: 'String'
                    }, {
                        name: 'allowReinstall',
                        type: 'Boolean'
                    }]
            }];
        super(metrics, deviceControl);
        this.cert = new NebulaCert();
    }
    fetchReleases() {
        return octokit.request('GET /repos/{owner}/{repo}/releases', {
            owner: 'slackhq',
            repo: 'nebula',
        }).then(({ data }) => {
            return data;
        });
    }
    async install({ isLighthouse, lighthouseNebulaIp, lighthousePublicEndpoint, lighthouseGroupId, lighthouseNodeId, lighthouseDeviceId, allowReinstall, name, nebulaIp, groups, version }) {
        //Fetch the release information from the github api
        const lighthouse = {
            nebulaIp: lighthouseNebulaIp,
            publicEndpoint: lighthousePublicEndpoint,
        };
        const isRunning = await this.getIsServiceRunning();
        if (allowReinstall && isRunning) {
            await runCommand('sudo systemctl stop squid-nebula.service');
            await runCommand('sudo systemctl disable squid-nebula.service');
        }
        if (!this.isInstalled || allowReinstall) {
            const downloadUrl = await this.fetchReleases()
                .then((releases) => {
                return releases.find((release) => {
                    return release.tag_name === version;
                })?.assets.find((asset) => {
                    return asset.name === 'nebula-linux-amd64.tar.gz';
                })?.browser_download_url;
            });
            if (!downloadUrl) {
                throw new Error(`Could not find download url for nebula version ${version}`);
            }
            const tarStream = await octokit.request(downloadUrl, { request: { parseSuccessResponseBody: false } })
                .then(({ data }) => data);
            await new Promise((resolve, reject) => {
                stream_1.default.pipeline(tarStream, (0, gunzip_maybe_1.default)(), tar_fs_1.default.extract('/usr/local/bin'), (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
            if (this.isInstalled) {
                log.info('Nebula was successfully installed.');
            }
            else {
                throw Error('Nebula was not successfully installed');
            }
            this.configure({ isLighthouse, lighthouse, allowReinstall });
            if (isLighthouse) {
                if (nebulaIp) {
                    await this.generateCaCertificate({ name: 'Squid', allowOverwrite: allowReinstall });
                    await this.generateHostCertificate({ isOwn: true, name, nebulaIp, groups, allowOverwrite: allowReinstall });
                    await this.installService(allowReinstall);
                }
                else {
                    throw Error('Need nebula ip to install lighthouse.');
                }
            }
            else {
                if (lighthouseGroupId && lighthouseNodeId && lighthouseDeviceId && nebulaIp) {
                    await this.cert.requestSendCert({
                        groupId: lighthouseGroupId,
                        nodeId: lighthouseNodeId,
                        deviceId: lighthouseDeviceId,
                        requesterGroupId: mqtt_1.mqtt.groupId,
                        requesterNodeId: mqtt_1.mqtt.nodeId,
                        requesterDeviceId: mqtt_1.mqtt.deviceId,
                        nebulaIp,
                        groups,
                        name,
                        allowReinstall,
                    });
                }
                else {
                    throw Error(`Need lighthouse group, node, and device ids to request a certificate. Got: ${JSON.stringify({ lighthouseGroupId, lighthouseNodeId, lighthouseDeviceId, nebulaIp, groups, name }, null, 2)}`);
                }
            }
        }
        else {
            throw Error('Nebula is already installed.');
        }
    }
    configure({ isLighthouse, lighthouse, allowReinstall }) {
        if (!this.isConfigured || allowReinstall) {
            const config = (0, defaultConfigs_1.getDefaultConfig)({ isLighthouse, lighthouse });
            const configYaml = js_yaml_1.default.dump(config);
            fs_1.default.mkdirSync('/etc/squid/nebula', { recursive: true });
            fs_1.default.writeFileSync('/etc/squid/nebula/config.yml', configYaml);
            if (fs_1.default.existsSync('/etc/squid/nebula/config.yml')) {
                log.info('Nebula was successfully configured.');
            }
            else {
                throw Error('Nebula was not successfully configured.');
            }
        }
        else {
            throw Error('Nebula is already configured.');
        }
    }
    async installService(allowReinstall) {
        let isRunning = await this.getIsServiceRunning();
        if (allowReinstall && isRunning) {
            await runCommand('sudo systemctl stop squid-nebula.service');
            await runCommand('sudo systemctl disable squid-nebula.service');
        }
        if (!isRunning || allowReinstall) {
            const config = (0, service_1.getSystemdConfig)();
            fs_1.default.writeFileSync('/etc/systemd/system/squid-nebula.service', config);
            await runCommand('sudo systemctl daemon-reload');
            await runCommand('sudo systemctl enable squid-nebula.service');
            await runCommand('sudo systemctl start squid-nebula.service');
            isRunning = await this.getIsServiceRunning();
            if (isRunning) {
                log.info('Nebula service was successfully installed.');
            }
            else {
                throw Error('Nebula service was not successfully installed.');
            }
        }
        else {
            throw Error('Nebula service is already installed.');
        }
    }
    generateHostCertificate(args) {
        return this.cert.generateHostCertificate(args);
    }
    generateCaCertificate(args) {
        return this.cert.generateCaCertificate(args);
    }
    sendCert(args) {
        return this.cert.sendCert(args);
    }
    async receiveCert(args) {
        await this.cert.receiveCert(args);
        await this.installService(args.allowReinstall);
    }
    getIsServiceRunning() {
        return runCommand('systemctl is-active --quiet squid-nebula.service').then(() => {
            return true;
        }).catch((err) => {
            return false;
        });
    }
    async getState() {
        const isRunning = await this.getIsServiceRunning();
        if (!this.isInstalled) {
            return 'pre-installation';
        }
        else if (!this.isConfigured) {
            return 'pre-configuration';
        }
        else if (!this.cert.hasCaCertificate) {
            return 'installed, no ca certificate';
        }
        else if (!this.cert.hasHostCertificate) {
            return 'installed, no host certificate';
        }
        else if (!isRunning) {
            return 'installed and certified, service not running';
        }
        else {
            return 'installed and certified, service running';
        }
    }
    getNebulaIp() {
        return getIpCidr('squid-nebula').catch((err) => {
            // log.debug(`Couldn't retrieve nebula ip: ${err}`)
            return null;
        });
    }
    get isConfigured() {
        return fs_1.default.existsSync('/etc/squid/nebula/config.yml');
    }
    get isInstalled() {
        return fs_1.default.existsSync('/usr/local/bin/nebula') && fs_1.default.existsSync('/usr/local/bin/nebula-cert');
    }
    get config() {
        const configPath = '/etc/squid/nebula/config.yml';
        if (fs_1.default.existsSync(configPath)) {
            return js_yaml_1.default.load(fs_1.default.readFileSync(configPath, 'utf-8'));
        }
        else {
            return null;
        }
    }
    get isLighthouse() {
        return !!this.config?.lighthouse?.am_lighthouse;
    }
}
exports.nebula = new Nebula();
