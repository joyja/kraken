import { nebula } from '../../nebula/index.js'
import { NebulaInstallInput } from '../../nebula/types.js'

const installNebula = (root:unknown, { isLighthouse, lighthouseNebulaIp, lighthouseGroupId, lighthouseNodeId, lighthouseDeviceId, lighthousePublicEndpoint, name, version, allowReinstall }:NebulaInstallInput) => {
  return nebula.install({ isLighthouse, lighthouseNebulaIp, lighthouseGroupId, lighthouseNodeId, lighthouseDeviceId, lighthousePublicEndpoint, name, version, allowReinstall })
}